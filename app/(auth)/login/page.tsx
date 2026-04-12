'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ParticleBackground } from '@/components/ParticleBackground'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">מתחבר...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.25)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.15)_0%,_transparent_50%)]" />

      <ParticleBackground />

      {/* Liquid morph blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-500/10 blur-3xl animate-liquid-morph" />
      <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-blue-500/10 blur-3xl animate-liquid-morph" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-2/3 left-1/2 w-48 h-48 bg-indigo-500/8 blur-3xl animate-liquid-morph" style={{ animationDelay: '-1.5s' }} />

      <div className="relative z-10 w-full max-w-md p-4 animate-scale-in">
        {/* Logo + title outside the card */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute -inset-3 bg-gradient-to-br from-violet-500/30 to-blue-500/30 rounded-3xl blur-xl animate-pulse-soft" />
            <img
              src="/unicamp-logo.jpeg"
              alt="UniCamp"
              className="relative w-24 h-24 rounded-2xl object-cover shadow-2xl shadow-violet-500/20 ring-2 ring-white/10 animate-float"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            UniCamp 2026
          </h1>
          <p className="text-violet-200/60 mt-1.5 text-sm font-medium">
            מערכת ניהול תקציב
          </p>
        </div>

        {/* Glass card with rotating gradient border */}
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/20 p-6 sm:p-8 rotating-border">
          {reason === 'inactive' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg p-3 mb-5 text-sm">
              החשבון שלך אינו פעיל. פנה למנהל המערכת.
            </div>
          )}
          {reason === 'auth-error' && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-lg p-3 mb-5 text-sm">
              שגיאה בהתחברות. נסה שוב או בקש הזמנה חדשה מהמנהל.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-violet-100/80 text-sm font-medium">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30 focus:border-violet-400/50 focus:ring-violet-400/20 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-violet-100/80 text-sm font-medium">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/30 focus:border-violet-400/50 focus:ring-violet-400/20 h-11 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  מתחבר...
                </span>
              ) : 'התחבר'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            {forgotMode ? (
              <div className="space-y-3 animate-fade-in">
                <p className="text-sm text-violet-200/50">הזן אימייל למעלה ולחץ:</p>
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-xl bg-white/[0.05] border-white/[0.1] text-violet-200 hover:bg-white/[0.1] hover:text-white"
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

        {/* Subtle footer */}
        <p className="text-center text-white/15 text-xs mt-6">
          Midburn Budget Management
        </p>
      </div>
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
