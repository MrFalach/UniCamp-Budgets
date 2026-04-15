'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/audit'
import { sendNotification } from '@/lib/email'

/**
 * Build a virtual pending reimbursement representing a camp's paid shitim advance.
 * Used before season close to surface the advance as "awaiting reimbursement" —
 * the real record is created by closeSeason().
 */
function buildVirtualShitimReimbursement(camp: Record<string, unknown>) {
  return {
    id: `virtual-shitim-${camp.id as string}`,
    camp_id: camp.id as string,
    total_amount: Number(camp.shitim_advance ?? 0),
    status: 'pending' as const,
    payment_method: null,
    payment_reference: null,
    paid_at: null,
    paid_by: null,
    notes: null,
    created_at: (camp.created_at as string) ?? new Date().toISOString(),
    camp,
  }
}

export async function getReimbursements() {
  const supabase = await createClient()
  const [reimbursementsResult, campsResult] = await Promise.all([
    supabase
      .from('reimbursements')
      .select('*, camp:camps(*)')
      .order('created_at', { ascending: false }),
    supabase
      .from('camps')
      .select('*')
      .eq('type', 'camp')
      .gt('shitim_advance', 0),
  ])

  if (reimbursementsResult.error) throw new Error(reimbursementsResult.error.message)

  const reimbursements = reimbursementsResult.data ?? []
  const campsWithAdvance = campsResult.data ?? []

  // Virtual rows only for camps that don't already have a real reimbursement record.
  const campIdsWithRecord = new Set(reimbursements.map((r) => r.camp_id))
  const virtualRows = campsWithAdvance
    .filter((c) => !campIdsWithRecord.has(c.id))
    .map((c) => buildVirtualShitimReimbursement(c))

  return [...virtualRows, ...reimbursements]
}

export async function getCampReimbursement(campId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reimbursements')
    .select('*, camp:camps(*)')
    .eq('camp_id', campId)
    .single()

  if (data) return data

  // Fall back to a virtual pending entry if the camp has a shitim advance on file.
  const { data: camp } = await supabase.from('camps').select('*').eq('id', campId).single()
  if (camp && Number(camp.shitim_advance ?? 0) > 0) {
    return buildVirtualShitimReimbursement(camp)
  }

  return null
}

export async function closeSeason() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Update season status
  const { error: settingsError } = await supabase
    .from('app_settings')
    .update({ season_status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (settingsError) throw new Error(settingsError.message)

  // Get all camps with approved expense totals
  const { data: camps } = await supabase.from('camps').select('id, name, shitim_advance').eq('is_active', true)
  if (!camps) return

  for (const camp of camps) {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('camp_id', camp.id)
      .eq('status', 'approved')

    const approved = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0
    // Advance was paid out-of-pocket by the camp, so it's reimbursed alongside approved expenses.
    const total = approved + Number(camp.shitim_advance ?? 0)

    if (total > 0) {
      // Check if reimbursement already exists
      const { data: existing } = await supabase
        .from('reimbursements')
        .select('id')
        .eq('camp_id', camp.id)
        .single()

      if (!existing) {
        await supabase
          .from('reimbursements')
          .insert({ camp_id: camp.id, total_amount: total })
      }
    }
  }

  await logAction(user.id, 'season_closed', 'app_settings', undefined)

  // Send notification to all camp members
  const { data: members } = await supabase
    .from('camp_members')
    .select('user_id, camp:camps(name), user:profiles(email, full_name)')

  if (members) {
    await sendNotification({
      type: 'season_closed',
      data: { members },
    })
  }

  revalidatePath('/')
}

export async function reopenSeason() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('app_settings')
    .update({ season_status: 'active', updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) throw new Error(error.message)

  await logAction(user.id, 'season_reopened', 'app_settings', undefined)

  revalidatePath('/')
}

export async function markReimbursementPaid(
  reimbursementId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const paymentMethod = formData.get('payment_method') as string
  const paymentReference = formData.get('payment_reference') as string | null
  const paidAt = formData.get('paid_at') as string || new Date().toISOString()
  const notes = formData.get('notes') as string | null

  const { error } = await supabase
    .from('reimbursements')
    .update({
      status: 'paid',
      payment_method: paymentMethod,
      payment_reference: paymentReference || null,
      paid_at: paidAt,
      paid_by: user.id,
      notes: notes || null,
    })
    .eq('id', reimbursementId)

  if (error) throw new Error(error.message)

  // Get reimbursement for notification
  const { data: reimbursement } = await supabase
    .from('reimbursements')
    .select('*, camp:camps(id, name)')
    .eq('id', reimbursementId)
    .single()

  if (reimbursement) {
    await logAction(user.id, 'reimbursement_paid', 'reimbursement', reimbursementId, undefined, {
      payment_method: paymentMethod,
      payment_reference: paymentReference,
    })

    // Notify camp members
    const { data: members } = await supabase
      .from('camp_members')
      .select('user:profiles(email, full_name)')
      .eq('camp_id', reimbursement.camp_id)

    await sendNotification({
      type: 'reimbursement_paid',
      data: {
        camp_name: (reimbursement.camp as Record<string, unknown>)?.name,
        amount: reimbursement.total_amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        members,
      },
    })
  }

  revalidatePath('/admin/reimbursements')
  revalidatePath('/camp')
}

export async function updateReimbursementPayment(
  reimbursementId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const paymentMethod = formData.get('payment_method') as string
  const paymentReference = formData.get('payment_reference') as string | null
  const paidAt = formData.get('paid_at') as string
  const notes = formData.get('notes') as string | null

  const { error } = await supabase
    .from('reimbursements')
    .update({
      payment_method: paymentMethod,
      payment_reference: paymentReference || null,
      paid_at: paidAt,
      notes: notes || null,
    })
    .eq('id', reimbursementId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/reimbursements')
}
