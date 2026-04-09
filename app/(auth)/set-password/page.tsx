'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    if (password !== confirm) {
      toast.error('הסיסמאות לא תואמות')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error('שגיאה בהגדרת סיסמה', { description: error.message })
      setLoading(false)
      return
    }

    toast.success('הסיסמה הוגדרה בהצלחה!')
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/3 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 animate-scale-in gradient-border">
        <CardHeader className="text-center pb-2">
          <img src="/unicamp-logo.jpeg" alt="UniCamp" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow-lg shadow-primary/20 animate-float" />
          <CardTitle className="text-2xl">UniCamp 2026</CardTitle>
          <CardDescription className="mt-1">הגדר סיסמה כדי להתחיל להשתמש במערכת</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה חדשה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                dir="ltr"
                placeholder="לפחות 6 תווים"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">אימות סיסמה</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                dir="ltr"
                placeholder="הקלד שוב את הסיסמה"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'שומר...' : 'הגדר סיסמה והיכנס'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
