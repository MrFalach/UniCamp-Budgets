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
import { Checkbox } from '@/components/ui/checkbox'
import { createCamp, updateCamp, updateCampCategories } from '@/lib/actions/camps'
import { toast } from 'sonner'
import type { Camp, ExpenseCategory } from '@/lib/types'

interface SupplierFormDialogProps {
  supplier?: Camp | null
  supplierEmail?: string | null
  allCategories: ExpenseCategory[]
  assignedCategoryIds?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierFormDialog({
  supplier,
  supplierEmail,
  allCategories,
  assignedCategoryIds = [],
  open,
  onOpenChange,
}: SupplierFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(assignedCategoryIds)
  const isEdit = !!supplier

  function handleCategoryToggle(categoryId: string, checked: boolean) {
    setSelectedCategories((prev) =>
      checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedCategories.length === 0) {
      toast.error('יש לבחור לפחות קטגוריה אחת')
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('type', 'supplier')
    for (const catId of selectedCategories) {
      formData.append('category_ids', catId)
    }

    try {
      if (isEdit) {
        await updateCamp(supplier!.id, formData)
        await updateCampCategories(supplier!.id, selectedCategories)
        toast.success('הספק עודכן בהצלחה')
        onOpenChange(false)
      } else {
        const result = await createCamp(formData)
        if (result?.inviteUrl) {
          setInviteUrl(result.inviteUrl)
          toast.success('הספק נוצר בהצלחה')
        } else {
          toast.success('הספק נוצר — המשתמש כבר קיים במערכת')
          onOpenChange(false)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בשמירת הספק')
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
    setSelectedCategories(assignedCategoryIds)
    onOpenChange(false)
  }

  if (inviteUrl) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>הספק נוצר בהצלחה!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              שלח את הלינק הבא למנהל הספק כדי שיוכל להיכנס ולהגדיר סיסמה:
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
              שים לב: הלינק תקף לשעה אחת בלבד. אם פג תוקף — לחץ &ldquo;שלח הזמנה&rdquo; בטבלת הספקים.
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'ערוך ספק' : 'ספק חדש'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" key={supplier?.id ?? 'new'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">שם הספק *</Label>
              <Input id="name" name="name" required defaultValue={supplier?.name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_budget">תקציב (₪) *</Label>
              <Input
                id="total_budget"
                name="total_budget"
                type="number"
                min={0}
                required
                defaultValue={supplier?.total_budget != null ? String(supplier.total_budget) : ''}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">אימייל מנהל הספק *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={supplierEmail ?? ''}
              dir="ltr"
              placeholder="supplier@example.com"
              disabled={isEdit}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                לאחר יצירת הספק תקבל לינק הזמנה לשלוח למשתמש
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>קטגוריות *</Label>
            <p className="text-xs text-muted-foreground">בחר את הקטגוריות הרלוונטיות לספק זה</p>
            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
              {allCategories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1.5 -mx-1">
                  <Checkbox
                    checked={selectedCategories.includes(cat.id)}
                    onCheckedChange={(checked) => handleCategoryToggle(cat.id, !!checked)}
                  />
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color ?? '#6B7280' }}
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
              {allCategories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  אין קטגוריות. צור קטגוריות בהגדרות.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea id="description" name="description" defaultValue={supplier?.description ?? ''} rows={2} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bank_account_name">שם בעל החשבון</Label>
              <Input id="bank_account_name" name="bank_account_name" defaultValue={supplier?.bank_account_name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">מספר חשבון</Label>
              <Input id="bank_account_number" name="bank_account_number" defaultValue={supplier?.bank_account_number ?? ''} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">שם הבנק</Label>
              <Input id="bank_name" name="bank_name" defaultValue={supplier?.bank_name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_branch">סניף</Label>
              <Input id="bank_branch" name="bank_branch" defaultValue={supplier?.bank_branch ?? ''} dir="ltr" />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : isEdit ? 'עדכן' : 'צור ספק'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
