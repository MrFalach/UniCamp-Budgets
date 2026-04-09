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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/3 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 animate-scale-in backdrop-blur-sm gradient-border">
        <CardHeader className="text-center pb-2">
          <img src="/unicamp-logo.jpeg" alt="UniCamp" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg shadow-primary/20 animate-float" />
          <CardTitle className="text-2xl font-bold gradient-text">UniCamp 2026</CardTitle>
          <CardDescription className="mt-1">התחבר למערכת ניהול התקציב</CardDescription>
        </CardHeader>
        <CardContent>
          {reason === 'inactive' && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 text-sm">
              החשבון שלך אינו פעיל. פנה למנהל המערכת.
            </div>
          )}
          {reason === 'auth-error' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 mb-4 text-sm">
              שגיאה בהתחברות. נסה שוב או בקש הזמנה חדשה מהמנהל.
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            {forgotMode ? (
              <div className="space-y-3 animate-fade-in">
                <p className="text-sm text-muted-foreground">הזן אימייל למעלה ולחץ:</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading || !email}
                >
                  {forgotLoading ? 'שולח...' : 'שלח קישור איפוס'}
                </Button>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setForgotMode(false)}
                >
                  חזור להתחברות
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setForgotMode(true)}
              >
                שכחת סיסמה?
              </button>
            )}
          </div>
        </CardContent>
      </Card>
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
