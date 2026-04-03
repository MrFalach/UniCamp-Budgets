'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from './StatusBadge'
import { CommentThread } from './CommentThread'
import { ConfirmDialog } from './ConfirmDialog'
import { updateExpenseStatus, deleteExpense, getExpenseComments } from '@/lib/actions/expenses'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { ExpenseWithRelations } from '@/lib/types'

interface ExpenseDetailDialogProps {
  expense: ExpenseWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
}

export function ExpenseDetailDialog({
  expense,
  open,
  onOpenChange,
  isAdmin = false,
}: ExpenseDetailDialogProps) {
  const [adminNote, setAdminNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [comments, setComments] = useState<Array<{
    id: string
    content: string
    created_at: string
    author?: { id: string; full_name: string | null; role?: string } | null
  }>>([])

  useEffect(() => {
    if (expense && open) {
      setAdminNote(expense.admin_note ?? '')
      getExpenseComments(expense.id).then(setComments).catch(() => {})
    }
  }, [expense, open])

  if (!expense) return null

  async function handleAction(status: 'approved' | 'rejected') {
    setLoading(true)
    try {
      await updateExpenseStatus(expense!.id, status, adminNote)
      toast.success(status === 'approved' ? 'ההוצאה אושרה' : 'ההוצאה נדחתה')
      onOpenChange(false)
    } catch (err) {
      toast.error('שגיאה בעדכון הוצאה')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteExpense(expense!.id)
      toast.success('ההוצאה נמחקה')
      onOpenChange(false)
    } catch (err) {
      toast.error('שגיאה במחיקת הוצאה')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              פרטי הוצאה
              <StatusBadge status={expense.status} />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Receipt */}
            {expense.receipt_url && (
              <div className="border rounded-lg p-3">
                {expense.receipt_type === 'image' ? (
                  <img
                    src={expense.receipt_url}
                    alt="Receipt"
                    className="max-h-64 rounded object-contain mx-auto"
                  />
                ) : (
                  <iframe
                    src={expense.receipt_url}
                    className="w-full h-64 rounded"
                    title="Receipt PDF"
                  />
                )}
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline mt-2 inline-block"
                >
                  הורד קבלה
                </a>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">סכום:</span>
                <p className="font-mono font-semibold text-lg">{formatCurrency(expense.amount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">קמפ:</span>
                <p>{expense.camp?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">קטגוריה:</span>
                <p>{expense.category?.name ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">הגיש:</span>
                <p>{expense.submitter?.full_name ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">תאריך:</span>
                <p>{formatDateTime(expense.submitted_at)}</p>
              </div>
              {expense.reviewer && (
                <div>
                  <span className="text-muted-foreground">נבדק ע״י:</span>
                  <p>{expense.reviewer.full_name}</p>
                </div>
              )}
            </div>

            <div>
              <span className="text-sm text-muted-foreground">תיאור:</span>
              <p className="text-sm mt-1">{expense.description}</p>
            </div>

            {expense.admin_note && expense.status !== 'pending' && (
              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-sm text-muted-foreground">הערת מנהל:</span>
                <p className="text-sm mt-1">{expense.admin_note}</p>
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <>
                <Separator />

                {expense.status === 'pending' && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="הערת מנהל (אופציונלי)..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAction('approved')}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        אשר
                      </Button>
                      <Button
                        onClick={() => handleAction('rejected')}
                        disabled={loading}
                        variant="destructive"
                      >
                        דחה
                      </Button>
                    </div>
                  </div>
                )}

                {expense.status !== 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(expense.status === 'approved' ? 'rejected' : 'approved')}
                      disabled={loading}
                    >
                      שנה ל{expense.status === 'approved' ? 'נדחה' : 'אושר'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                    >
                      מחק
                    </Button>
                  </div>
                )}
              </>
            )}

            <Separator />

            {/* Comments */}
            <CommentThread expenseId={expense.id} comments={comments} />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="מחיקת הוצאה"
        description="האם אתה בטוח שברצונך למחוק הוצאה זו? פעולה זו לא ניתנת לביטול."
        onConfirm={handleDelete}
        confirmLabel="מחק"
        variant="destructive"
      />
    </>
  )
}
