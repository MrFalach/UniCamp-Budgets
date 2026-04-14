'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Invite } from '@/lib/types'

/**
 * Create an invite record and return a preview-safe /invite/<nonce> URL.
 * No Supabase auth token is generated here — that happens on-demand
 * when the recipient clicks "set password" on the invite page.
 */
export async function createInvite(email: string, campId?: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('invites')
    .insert({ email, camp_id: campId ?? null })
    .select('nonce')
    .single()

  if (error) throw new Error(error.message)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return `${siteUrl}/invite/${data.nonce}`
}

/**
 * Look up an invite by nonce. Returns null if not found or expired.
 * Uses admin client so it works for unauthenticated visitors.
 */
export async function getInvite(nonce: string): Promise<(Invite & { camp_name: string | null }) | null> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('invites')
    .select('*, camp:camps(name)')
    .eq('nonce', nonce)
    .single()

  if (error || !data) return null

  // Check expiry
  if (new Date(data.expires_at) < new Date()) return null

  return {
    nonce: data.nonce,
    email: data.email,
    camp_id: data.camp_id,
    created_at: data.created_at,
    expires_at: data.expires_at,
    consumed_at: data.consumed_at,
    camp_name: data.camp?.name ?? null,
  }
}

/**
 * Consume an invite: generate a fresh Supabase recovery link and return it.
 * Called when the human clicks "set password" on the invite page.
 */
export async function consumeInvite(nonce: string): Promise<string> {
  const adminClient = createAdminClient()

  // Look up invite
  const { data: invite, error } = await adminClient
    .from('invites')
    .select('*')
    .eq('nonce', nonce)
    .single()

  if (error || !invite) throw new Error('ההזמנה לא נמצאה')
  if (new Date(invite.expires_at) < new Date()) throw new Error('ההזמנה פגה תוקף')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectTo = `${siteUrl}/auth/callback?next=/set-password`

  // Try recovery first (user already exists from camp creation).
  // Fall back to invite if user doesn't exist yet.
  let actionLink: string

  const { data: recoveryData, error: recoveryError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: invite.email,
    options: { redirectTo },
  })

  if (!recoveryError && recoveryData?.properties?.action_link) {
    actionLink = recoveryData.properties.action_link
  } else {
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: invite.email,
      options: { redirectTo },
    })
    if (inviteError) throw new Error(inviteError.message)
    actionLink = inviteData.properties?.action_link ?? ''
  }

  // Mark consumed
  await adminClient
    .from('invites')
    .update({ consumed_at: new Date().toISOString() })
    .eq('nonce', nonce)

  return actionLink
}
