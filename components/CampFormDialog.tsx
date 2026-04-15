'use client'

import { useState, useMemo } from 'react'
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

interface CampFormDialogProps {
  camp?: Camp | null
  campEmail?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** All expense categories (needed for production type) */
  allCategories?: ExpenseCategory[]
  /** Category IDs already assigned to other productions (for exclusion) */
  takenProductionCategoryIds?: string[]
  /** Category IDs assigned to this camp/production when editing */
  assignedCategoryIds?: string[]
}

export function CampFormDialog({
  camp,
  campEmail,
  open,
  onOpenChange,
  allCategories = [],
  takenProductionCategoryIds = [],
  assignedCategoryIds = [],
}: CampFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [entityType, setEntityType] = useState<'camp' | 'production'>(camp?.type === 'production' ? 'production' : 'camp')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(assignedCategoryIds)
  const isEdit = !!camp

  // Categories available for production: exclude Gifting + already taken by other productions
  const availableCategories = useMemo(() => {
    return allCategories.filter((cat) => {
      if (cat.name === 'גיפטינג') return false
      // If editing a production, allow its own categories
      if (isEdit && assignedCategoryIds.includes(cat.id)) return true
      // Exclude categories taken by other productions
      if (takenProductionCategoryIds.includes(cat.id)) return false
      return true
    })
  }, [allCategories, takenProductionCategoryIds, assignedCategoryIds, isEdit])

  // Auto-calculated budget for production: sum of selected categories' budget_cap
  const productionBudget = useMemo(() => {
    if (entityType !== 'production') return 0
    return selectedCategories.reduce((sum, catId) => {
      const cat = allCategories.find((c) => c.id === catId)
      return sum + (cat?.budget_cap ?? 0)
    }, 0)
  }, [entityType, selectedCategories, allCategories])

  function handleCategoryToggle(categoryId: string, checked: boolean) {
    setSelectedCategories((prev) =>
      checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (entityType === 'production' && selectedCategories.length === 0) {
      toast.error('יש לבחור לפחות קטגוריה אחת')
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('type', entityType)

    if (entityType === 'production') {
      // Override budget with auto-calculated value
      formData.set('total_budget', String(productionBudget))
      for (const catId of selectedCategories) {
        formData.append('category_ids', catId)
      }
    }

    try {
      if (isEdit) {
        await updateCamp(camp!.id, formData)
        if (entityType === 'production') {
          await updateCampCategories(camp!.id, selectedCategories)
        }
        toast.success(entityType === 'production' ? 'ההפקה עודכנה בהצלחה' : 'הקמפ עודכן בהצלחה')
        onOpenChange(false)
      } else {
        const result = await createCamp(formData)
        if (result?.inviteUrl) {
          setInviteUrl(result.inviteUrl)
          toast.success(entityType === 'production' ? 'ההפקה נוצרה בהצלחה' : 'הקמפ נוצר בהצלחה')
        } else {
          toast.success(entityType === 'production' ? 'ההפקה נוצרה — המשתמש כבר קיים במערכת' : 'הקמפ נוצר — המשתמש כבר קיים במערכת')
          onOpenChange(false)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בשמירה')
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
    setEntityType(camp?.type === 'production' ? 'production' : 'camp')
    onOpenChange(false)
  }

  const entityLabel = entityType === 'production' ? 'הפקה' : 'קמפ'

  // Show invite link after creation
  if (inviteUrl) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ה{entityLabel} נוצר בהצלחה!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              שלח את הלינק הבא למנהל ה{entityLabel} כדי שיוכל להיכנס ולהגדיר סיסמה:
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
              שים לב: הלינק תקף ל-14 ימים. אם פג תוקף — לחץ &ldquo;העתק לינק&rdquo; ברשימה.
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
      <DialogContent className="max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `ערוך ${entityLabel}` : `${entityLabel} חדש`}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" key={camp?.id ?? 'new'}>
          {/* Type selector — only on creation */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>סוג *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={entityType === 'camp' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => { setEntityType('camp'); setSelectedCategories([]) }}
                >
                  🏕️ קמפ
                </Button>
                <Button
                  type="button"
                  variant={entityType === 'production' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => { setEntityType('production'); setSelectedCategories([]) }}
                >
                  🎬 הפקה
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">שם ה{entityLabel} *</Label>
              <Input id="name" name="name" required defaultValue={camp?.name ?? ''} />
            </div>
            {entityType === 'camp' ? (
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
            ) : (
              <div className="space-y-2">
                <Label>תקציב (₪)</Label>
                <div className="h-10 px-3 rounded-md border bg-muted/50 flex items-center text-sm font-mono" dir="ltr">
                  {productionBudget > 0 ? `₪${productionBudget.toLocaleString()}` : 'ייקבע לפי קטגוריות'}
                </div>
                <p className="text-xs text-muted-foreground">מחושב אוטומטית מסכום הקטגוריות</p>
              </div>
            )}
          </div>

          {/* Shitim advance — camps only */}
          {entityType === 'camp' && (
            <div className="space-y-2">
              <Label htmlFor="shitim_advance">מקדמה שיטים (₪)</Label>
              <Input
                id="shitim_advance"
                name="shitim_advance"
                type="number"
                min={0}
                step="0.01"
                defaultValue={camp?.shitim_advance != null ? String(camp.shitim_advance) : '0'}
                dir="ltr"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                סכום ששולם ע&quot;י הקמפ ישירות לאירוע כמקדמה לשיטים. אינו מנוצל מתקציב הגיפטינג — נחשב כהוצאה מאושרת וייווסף להחזר בסגירת העונה.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">אימייל מנהל ה{entityLabel} *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={campEmail ?? ''}
              dir="ltr"
              placeholder="manager@example.com"
              disabled={isEdit}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                לאחר היצירה תקבל לינק הזמנה לשלוח למשתמש
              </p>
            )}
          </div>

          {/* Category selection — production only */}
          {entityType === 'production' && (
            <div className="space-y-2">
              <Label>קטגוריות *</Label>
              <p className="text-xs text-muted-foreground">בחר את הקטגוריות שבאחריות ההפקה</p>
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {availableCategories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1.5 -mx-1">
                    <Checkbox
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={(checked) => handleCategoryToggle(cat.id, !!checked)}
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color ?? '#6B7280' }}
                    />
                    <span className="text-sm flex-1">{cat.name}</span>
                    {cat.budget_cap != null && cat.budget_cap > 0 && (
                      <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                        ₪{cat.budget_cap.toLocaleString()}
                      </span>
                    )}
                  </label>
                ))}
                {availableCategories.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    אין קטגוריות זמינות. צור קטגוריות בהגדרות או שחרר קטגוריות מהפקות אחרות.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea id="description" name="description" defaultValue={camp?.description ?? ''} rows={2} />
          </div>

          {/* Bank details — only shown when editing */}
          {isEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שומר...' : isEdit ? 'עדכן' : `צור ${entityLabel}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
