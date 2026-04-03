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
import { Textarea } from '@/components/ui/textarea'
import { createCamp, updateCamp } from '@/lib/actions/camps'
import { toast } from 'sonner'
import type { Camp } from '@/lib/types'

interface CampFormDialogProps {
  camp?: Camp | null
  campEmail?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CampFormDialog({ camp, campEmail, open, onOpenChange }: CampFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const isEdit = !!camp

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      if (isEdit) {
        await updateCamp(camp!.id, formData)
        toast.success('הקמפ עודכן בהצלחה')
        onOpenChange(false)
      } else {
        const result = await createCamp(formData)
        if (result?.inviteUrl) {
          setInviteUrl(result.inviteUrl)
          toast.success('הקמפ נוצר בהצלחה')
        } else {
          toast.success('הקמפ נוצר — המשתמש כבר קיים במערכת')
          onOpenChange(false)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בשמירת הקמפ')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyLink() {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      toast.success('הלינק הועתק!')
    }
  }

  function handleClose() {
    setInviteUrl(null)
    onOpenChange(false)
  }

  // Show invite link after creation
  if (inviteUrl) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>הקמפ נוצר בהצלחה!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              שלח את הלינק הבא למנהל הקמפ כדי שיוכל להיכנס ולהגדיר סיסמה:
            </p>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <input
                readOnly
                value={inviteUrl}
                dir="ltr"
                className="flex-1 bg-transparent text-xs font-mono outline-none truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="sm" onClick={handleCopyLink}>
                העתק
              </Button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              שים לב: הלינק תקף לשעה אחת בלבד. אם פג תוקף — לחץ "שלח הזמנה" בטבלת הקמפים.
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>סגור</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'ערוך קמפ' : 'קמפ חדש'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" key={camp?.id ?? 'new'}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">שם הקמפ *</Label>
              <Input id="name" name="name" required defaultValue={camp?.name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_budget">תקציב (₪) *</Label>
              <Input
                id="total_budget"
                name="total_budget"
                type="number"
                min={0}
                required
                defaultValue={camp?.total_budget != null ? String(camp.total_budget) : ''}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">אימייל מנהל הקמפ *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={campEmail ?? ''}
              dir="ltr"
              placeholder="camp-manager@example.com"
              disabled={isEdit}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                לאחר יצירת הקמפ תקבל לינק הזמנה לשלוח למשתמש
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea id="description" name="description" defaultValue={camp?.description ?? ''} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bank_account_name">שם בעל החשבון</Label>
              <Input id="bank_account_name" name="bank_account_name" defaultValue={camp?.bank_account_name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">מספר חשבון</Label>
              <Input id="bank_account_number" name="bank_account_number" defaultValue={camp?.bank_account_number ?? ''} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">שם הבנק</Label>
              <Input id="bank_name" name="bank_name" defaultValue={camp?.bank_name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_branch">סניף</Label>
              <Input id="bank_branch" name="bank_branch" defaultValue={camp?.bank_branch ?? ''} dir="ltr" />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : isEdit ? 'עדכן' : 'צור קמפ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
