'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAction } from '@/lib/audit'

export async function getUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*, camp_members(camp_id, camp:camps(id, name))')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function inviteUser(email: string) {
  const { data: { user: currentUser } } = await (await createClient()).auth.getUser()
  if (!currentUser) throw new Error('Unauthorized')

  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
  })
  if (error) throw new Error(error.message)

  await logAction(currentUser.id, 'user_invited', 'profile', data.user.id, undefined, { email })

  revalidatePath('/admin/users')
  return data
}

export async function updateUser(userId: string, updates: {
  full_name?: string
  role?: string
  is_active?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: old } = await supabase.from('profiles').select('*').eq('id', userId).single()

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) throw new Error(error.message)

  const action = updates.is_active === false
    ? 'user_deactivated'
    : updates.role
    ? 'user_role_changed'
    : 'user_updated'

  await logAction(user.id, action, 'profile', userId, old as Record<string, unknown>, updates)

  revalidatePath('/admin/users')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function resendInvite(email: string): Promise<string> {
  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Generate a new recovery link (no email sent)
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
    },
  })

  if (error) throw new Error(error.message)

  return data.properties?.action_link ?? ''
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const { redirect } = await import('next/navigation')
  redirect('/login')
}

export async function markWelcomeSeen() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').update({ has_seen_welcome: true }).eq('id', user.id)
  revalidatePath('/camp')
}
