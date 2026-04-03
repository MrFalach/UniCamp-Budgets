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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { markReimbursementPaid, updateReimbursementPayment } from '@/lib/actions/reimbursements'
import { toast } from 'sonner'
import type { Reimbursement } from '@/lib/types'

interface ReimbursementDialogProps {
  reimbursement: Reimbursement
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'pay' | 'edit'
}

export function ReimbursementDialog({
  reimbursement,
  open,
  onOpenChange,
  mode,
}: ReimbursementDialogProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      if (mode === 'pay') {
        await markReimbursementPaid(reimbursement.id, formData)
        toast.success('התשלום סומן בהצלחה')
      } else {
        await updateReimbursementPayment(reimbursement.id, formData)
        toast.success('פרטי התשלום עודכנו')
      }
      onOpenChange(false)
    } catch (err) {
      toast.error('שגיאה בעדכון')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'pay' ? 'סמן כשולם' : 'ערוך פרטי תשלום'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>אמצעי תשלום</Label>
            <Select name="payment_method" defaultValue={reimbursement.payment_method ?? 'bank_transfer'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                <SelectItem value="bit">Bit</SelectItem>
                <SelectItem value="cash">מזומן</SelectItem>
                <SelectItem value="other">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_reference">אסמכתא / מספר העברה</Label>
            <Input
              id="payment_reference"
              name="payment_reference"
              defaultValue={reimbursement.payment_reference ?? ''}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid_at">תאריך תשלום</Label>
            <Input
              id="paid_at"
              name="paid_at"
              type="date"
              defaultValue={
                reimbursement.paid_at
                  ? new Date(reimbursement.paid_at).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={reimbursement.notes ?? ''}
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : mode === 'pay' ? 'סמן כשולם' : 'עדכן'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
