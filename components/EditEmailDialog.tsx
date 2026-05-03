'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateUserEmail } from '@/lib/actions/users'
import { toast } from 'sonner'

interface EditEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  currentEmail: string | null
  displayName?: string | null
  onSuccess?: () => void
}

export function EditEmailDialog({
  open,
  onOpenChange,
  userId,
  currentEmail,
  displayName,
  onSuccess,
}: EditEmailDialogProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setEmail(currentEmail ?? '')
  }, [open, currentEmail])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    try {
      await updateUserEmail(userId, email)
      toast.success('האימייל עודכן')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error('שגיאה בעדכון אימייל', {
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
          <DialogTitle>עריכת אימייל{displayName ? ` — ${displayName}` : ''}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-email">כתובת אימייל חדשה</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            כתובת האימייל תתעדכן גם בהתחברות למערכת. המשתמש יוכל להתחבר בעזרת
            הכתובת החדשה.
          </p>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : 'שמור'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
