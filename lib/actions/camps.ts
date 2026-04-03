'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/audit'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/email'
import type { Camp } from '@/lib/types'

export async function getCamps() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('camps')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

export async function getCampsWithUsers() {
  const supabase = await createClient()
  const { data: camps } = await supabase.from('camps').select('*').order('name')
  if (!camps) return []

  const { data: members } = await supabase
    .from('camp_members')
    .select('camp_id, user:profiles(email, full_name)')

  return camps.map((camp) => {
    const member = members?.find((m) => m.camp_id === camp.id)
    return {
      ...camp,
      user_email: (member?.user as unknown as Record<string, unknown>)?.email as string | null ?? null,
      user_name: (member?.user as unknown as Record<string, unknown>)?.full_name as string | null ?? null,
    }
  })
}

export async function getCampWithBudget(campId: string) {
  const supabase = await createClient()

  const { data: camp } = await supabase.from('camps').select('*').eq('id', campId).single()
  if (!camp) throw new Error('Camp not found')

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, status')
    .eq('camp_id', campId)

  const approved = expenses?.filter((e) => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0) ?? 0
  const pending = expenses?.filter((e) => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0) ?? 0

  return {
    ...camp,
    total_approved: approved,
    total_pending: pending,
    remaining: camp.total_budget - approved,
    usage_percent: camp.total_budget > 0 ? (approved / camp.total_budget) * 100 : 0,
  }
}

export async function getAllCampsWithBudgets() {
  const supabase = await createClient()

  const { data: camps } = await supabase.from('camps').select('*').order('name')
  if (!camps) return []

  const { data: expenses } = await supabase
    .from('expenses')
    .select('camp_id, amount, status')

  return camps.map((camp) => {
    const campExpenses = expenses?.filter((e) => e.camp_id === camp.id) ?? []
    const approved = campExpenses.filter((e) => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0)
    const pending = campExpenses.filter((e) => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0)
    const rejected = campExpenses.filter((e) => e.status === 'rejected').reduce((s, e) => s + Number(e.amount), 0)

    return {
      camp,
      total_approved: approved,
      total_pending: pending,
      total_rejected: rejected,
      remaining: camp.total_budget - approved,
      usage_percent: camp.total_budget > 0 ? (approved / camp.total_budget) * 100 : 0,
    }
  })
}

export async function createCamp(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const totalBudget = Number(formData.get('total_budget'))
  const email = (formData.get('email') as string)?.trim()
  const description = formData.get('description') as string | null
  const bankAccountName = formData.get('bank_account_name') as string | null
  const bankAccountNumber = formData.get('bank_account_number') as string | null
  const bankName = formData.get('bank_name') as string | null
  const bankBranch = formData.get('bank_branch') as string | null

  if (!email) throw new Error('יש להזין אימייל למנהל הקמפ')

  // 1. Create the camp
  const { data: camp, error } = await supabase
    .from('camps')
    .insert({
      name,
      total_budget: totalBudget,
      description: description || null,
      bank_account_name: bankAccountName || null,
      bank_account_number: bankAccountNumber || null,
      bank_name: bankName || null,
      bank_branch: bankBranch || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // 2. Find or invite the user
  const adminClient = createAdminClient()
  let campUserId: string
  let inviteUrl: string | null = null

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    campUserId = existingProfile.id
    // Ensure role is 'camp'
    await supabase.from('profiles').update({ role: 'camp' }).eq('id', campUserId)
  } else {
    // Create user and generate invite link (no email sent — admin shares the link manually)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
      },
    })
    if (linkError) throw new Error(`שגיאה ביצירת המשתמש: ${linkError.message}`)
    campUserId = linkData.user.id

    // Wait briefly for the trigger to create the profile, then set role
    await new Promise((r) => setTimeout(r, 500))
    await adminClient.from('profiles').update({ role: 'camp' }).eq('id', campUserId)

    inviteUrl = linkData.properties?.action_link ?? null
  }

  // 3. Assign user to camp
  const { error: memberError } = await supabase
    .from('camp_members')
    .insert({ camp_id: camp.id, user_id: campUserId })

  if (memberError && memberError.code !== '23505') {
    throw new Error(memberError.message)
  }

  await logAction(user.id, 'camp_created', 'camp', camp.id, undefined, { name, total_budget: totalBudget, email })

  revalidatePath('/admin')
  return { camp, inviteUrl }
}

export async function updateCamp(campId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: old } = await supabase.from('camps').select('*').eq('id', campId).single()

  const name = formData.get('name') as string
  const totalBudget = Number(formData.get('total_budget'))
  const description = formData.get('description') as string | null
  const bankAccountName = formData.get('bank_account_name') as string | null
  const bankAccountNumber = formData.get('bank_account_number') as string | null
  const bankName = formData.get('bank_name') as string | null
  const bankBranch = formData.get('bank_branch') as string | null

  const { error } = await supabase
    .from('camps')
    .update({
      name,
      total_budget: totalBudget,
      description: description || null,
      bank_account_name: bankAccountName || null,
      bank_account_number: bankAccountNumber || null,
      bank_name: bankName || null,
      bank_branch: bankBranch || null,
    })
    .eq('id', campId)

  if (error) throw new Error(error.message)

  await logAction(user.id, 'camp_updated', 'camp', campId, old as Record<string, unknown>, { name, total_budget: totalBudget })

  revalidatePath('/admin')
}

export async function deleteCamp(campId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check for expenses
  const { count } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('camp_id', campId)

  if (count && count > 0) {
    throw new Error('לא ניתן למחוק קמפ שיש לו הוצאות')
  }

  const { data: old } = await supabase.from('camps').select('*').eq('id', campId).single()
  const { error } = await supabase.from('camps').delete().eq('id', campId)
  if (error) throw new Error(error.message)

  await logAction(user.id, 'camp_deleted', 'camp', campId, old as Record<string, unknown>)

  revalidatePath('/admin')
}

export async function getCampMembers(campId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('camp_members')
    .select('*, user:profiles(id, full_name, email, role)')
    .eq('camp_id', campId)

  if (error) throw new Error(error.message)
  return data
}

export async function addCampMember(campId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('camp_members')
    .insert({ camp_id: campId, user_id: userId })

  if (error) {
    if (error.code === '23505') throw new Error('המשתמש כבר חבר בקמפ')
    throw new Error(error.message)
  }

  revalidatePath('/admin')
}

export async function removeCampMember(campId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('camp_members')
    .delete()
    .eq('camp_id', campId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}

export async function getUserCamp(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('camp_members')
    .select('camp_id, camp:camps(*)')
    .eq('user_id', userId)
    .limit(1)
    .single()

  return (data?.camp ?? null) as Camp | null
}

export async function updateCampBankDetails(campId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('camps')
    .update({
      bank_account_name: formData.get('bank_account_name') as string || null,
      bank_account_number: formData.get('bank_account_number') as string || null,
      bank_name: formData.get('bank_name') as string || null,
      bank_branch: formData.get('bank_branch') as string || null,
    })
    .eq('id', campId)

  if (error) throw new Error(error.message)

  revalidatePath('/camp')
  revalidatePath('/admin')
}
