import { consumeInvite } from '@/lib/actions/invites'
import { NextResponse } from 'next/server'

/**
 * POST /invite/[nonce]/start
 * Called when a human clicks "set password" on the invite page.
 * Generates a fresh Supabase action_link on-demand and redirects to it.
 * Preview bots never reach here because they don't submit forms.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ nonce: string }> }
) {
  const { nonce } = await params

  try {
    const actionLink = await consumeInvite(nonce)
    if (!actionLink) {
      return NextResponse.redirect(new URL('/login?reason=auth-error', _request.url))
    }
    return NextResponse.redirect(actionLink, 303)
  } catch {
    return NextResponse.redirect(new URL('/login?reason=auth-error', _request.url))
  }
}
