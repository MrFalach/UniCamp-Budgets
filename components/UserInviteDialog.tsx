'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteUser } from '@/lib/actions/users'
import { toast } from 'sonner'

interface UserInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserInviteDialog({ open, onOpenChange }: UserInviteDialogProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await inviteUser(email)
      toast.success('הזמנה נשלחה', { description: email })
      setEmail('')
      onOpenChange(false)
    } catch (err) {
      toast.error('שגיאה בשליחת הזמנה', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הזמן משתמש חדש</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">כתובת אימייל</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            המשתמש יקבל אימייל עם הזמנה להצטרף למערכת.
          </p>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שולח...' : 'שלח הזמנה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
