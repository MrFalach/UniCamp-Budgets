import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Handles three Supabase auth-email link shapes, per current Supabase docs:
 *   1. PKCE flow:        ?code=xxx
 *   2. OTP / token-hash: ?token_hash=xxx&type=invite|recovery|magiclink|signup|email_change|email
 *   3. Implicit / hash:  #access_token=...&type=...  (browser-side only — server can't see the fragment)
 *
 * For (3) we just pass through to /login so the client-side hash handler there can pick it up,
 * without showing an error banner.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  // 1. PKCE flow
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?reason=auth-error`)
  }

  // 2. OTP / token-hash flow (default for invite & recovery emails in current Supabase dashboards)
  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?reason=auth-error`)
  }

  // 3. Implicit / hash flow — fragment isn't sent to the server, so just forward to /login
  //    preserving the URL as-is. The browser keeps the fragment across the redirect; the
  //    login page's useEffect will parse it and set the session.
  return NextResponse.redirect(`${origin}/login`)
}
