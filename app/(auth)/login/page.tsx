'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CreditLine } from '@/components/CreditLine'

const FLOATING_EMOJIS = ['🔥', '⭐', '🎪', '✨', '🌈', '🎵', '💫', '🦋', '🌸', '🎨', '🪩', '🎭']

function FloatingEmojis() {
  const [emojis, setEmojis] = useState<Array<{
    id: number; emoji: string; x: number; y: number;
    size: number; duration: number; delay: number; drift: number;
  }>>([])

  useEffect(() => {
    const items = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: FLOATING_EMOJIS[i % FLOATING_EMOJIS.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 14 + Math.random() * 18,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * -10,
      drift: -30 + Math.random() * 60,
    }))
    setEmojis(items)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {emojis.map((e) => (
        <div
          key={e.id}
          className="absolute"
          style={{
            left: `${e.x}%`,
            top: `${e.y}%`,
            fontSize: `${e.size}px`,
            opacity: 0.15,
            animation: `sp-float ${e.duration}s ease-in-out ${e.delay}s infinite`,
            '--drift': `${e.drift}px`,
          } as React.CSSProperties}
        >
          {e.emoji}
        </div>
      ))}
    </div>
  )
}

function TwinklingStars() {
  const [stars, setStars] = useState<Array<{
    id: number; left: number; top: number; opacity: number; duration: number; delay: number;
  }>>([])

  useEffect(() => {
    setStars(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: 0.1 + Math.random() * 0.4,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * -3,
    })))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute w-[2px] h-[2px] rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            opacity: s.opacity,
            animation: `sp-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')

  const supabase = createClient()

  // Handle invite/recovery tokens in URL hash (#access_token=...)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token')) {
      queueMicrotask(() => setCheckingToken(false))
      return
    }

    // Parse tokens from hash and set the session manually
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('Session error:', error)
          setCheckingToken(false)
          return
        }
        if (type === 'invite' || type === 'recovery') {
          window.location.href = '/set-password'
        } else {
          window.location.href = '/'
        }
      })
    } else {
      queueMicrotask(() => setCheckingToken(false))
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('שגיאה בהתחברות', { description: error.message })
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error('הזן אימייל קודם')
      return
    }
    setForgotLoading(true)
    const siteUrl = window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/set-password`,
    })
    if (error) {
      toast.error('שגיאה', { description: error.message })
    } else {
      toast.success('נשלח!', { description: 'בדוק את תיבת האימייל שלך לקישור איפוס סיסמה' })
      setForgotMode(false)
    }
    setForgotLoading(false)
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0f0a1e] via-[#1a1035] to-[#0d0b1a]">
        <div className="flex flex-col items-center gap-3 text-violet-200/60">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
          <p className="text-sm">מתחבר...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Warm dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a1e] via-[#1a1035] to-[#0d0b1a]" />

      {/* Soft aurora glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-violet-600/10 via-fuchsia-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-t from-blue-600/8 to-transparent rounded-full blur-3xl" />

      {/* Floating emojis */}
      <FloatingEmojis />

      {/* Stars */}
      <TwinklingStars />

      <div className="relative z-10 w-full max-w-md p-4">
        {/* Logo + title */}
        <div className="text-center mb-6 animate-scale-in">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-2xl" />
            <img
              src="/unicamp-logo.jpeg"
              alt="UniCamp"
              className="relative w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-violet-500/30 ring-2 ring-white/10 animate-float"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            UniCamp 2026
          </h1>
          <p className="text-violet-200/50 mt-1 text-sm">
            מערכת ניהול תקציב 💸
          </p>
        </div>

        <div className="animate-scale-in">
          <div className="bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl p-6 sm:p-8">
            {reason === 'inactive' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl p-3 mb-5 text-sm">
                החשבון שלך אינו פעיל. פנה למנהל המערכת.
              </div>
            )}
            {reason === 'auth-error' && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl p-3 mb-5 text-sm">
                שגיאה בהתחברות. נסה שוב או בקש הזמנה חדשה מהמנהל.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-violet-100/70 text-sm font-medium">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 focus:border-violet-400/40 focus:ring-violet-400/15 h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-violet-100/70 text-sm font-medium">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 focus:border-violet-400/40 focus:ring-violet-400/15 h-11 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 text-[15px]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    מתחבר...
                  </span>
                ) : 'יאללה, נכנסים! 🚀'}
              </Button>
            </form>

            <div className="mt-5 text-center">
              {forgotMode ? (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-sm text-violet-200/50">הזן אימייל למעלה ולחץ:</p>
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl bg-white/[0.05] border-white/[0.08] text-violet-200 hover:bg-white/[0.1] hover:text-white"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading || !email}
                  >
                    {forgotLoading ? 'שולח...' : 'שלח קישור איפוס'}
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-violet-300/40 hover:text-violet-200 transition-colors"
                    onClick={() => setForgotMode(false)}
                  >
                    חזור להתחברות
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="text-sm text-violet-300/40 hover:text-violet-200 transition-colors"
                  onClick={() => setForgotMode(true)}
                >
                  שכחת סיסמה?
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Credit footer */}
        <div className="flex justify-center mt-6">
          <CreditLine />
        </div>
      </div>

      <style>{`
        @keyframes sp-float {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-15px) translateX(calc(var(--drift) * 0.5)) rotate(5deg); }
          50% { transform: translateY(-25px) translateX(var(--drift)) rotate(-3deg); }
          75% { transform: translateY(-10px) translateX(calc(var(--drift) * 0.3)) rotate(4deg); }
        }
        @keyframes sp-twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
