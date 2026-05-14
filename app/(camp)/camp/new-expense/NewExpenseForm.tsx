'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ReceiptUpload } from '@/components/ReceiptUpload'
import { submitExpense } from '@/lib/actions/expenses'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { CampType, ExpenseCategory } from '@/lib/types'

interface Props {
  categories: ExpenseCategory[]
  campType: CampType | null
  campId: string | null
}

export function NewExpenseForm({ categories, campType, campId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!campId) {
      toast.error('לא משויך לקמפ')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      let receiptPath: string | null = null
      let receiptType: string | null = null

      if (file) {
        const supabase = createClient()
        const ext = file.name.split('.').pop()
        const path = `${campId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(path, file)

        if (uploadError) throw uploadError

        // Persist the storage path, not a signed URL — signed URLs expire
        // after an hour. The view side mints a fresh URL on every render.
        receiptPath = path
        receiptType = file.type.startsWith('image/') ? 'image' : 'pdf'
      }
      formData.set('camp_id', campId)
      if (receiptPath) formData.set('receipt_path', receiptPath)
      if (receiptType) formData.set('receipt_type', receiptType)

      await submitExpense(formData)
      toast.success('ההוצאה הוגשה בהצלחה')
      router.push('/camp/expenses')
    } catch (err) {
      toast.error('שגיאה בהגשת ההוצאה', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>הגש הוצאה חדשה</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">סכום (₪) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              required
              dir="ltr"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור *</Label>
            <Textarea
              id="description"
              name="description"
              required
              placeholder="תאר את ההוצאה..."
              rows={3}
            />
          </div>

          {/* Category: camps → locked Gifting, productions → dropdown, suppliers → locked first */}
          <div className="space-y-2">
            <Label>קטגוריה</Label>
            {campType === 'camp' ? (
              <div className="flex items-center gap-2 h-10 px-3 rounded-xl border bg-muted/50">
                <span className="text-sm">🎁</span>
                <span className="text-sm font-medium">גיפטינג</span>
                <span className="text-[10px] text-muted-foreground mr-auto">🔒 נעול</span>
              </div>
            ) : campType === 'production' && categories.length > 0 ? (
              <select
                name="category_id"
                required
                className="w-full h-11 px-3 rounded-xl border bg-background text-sm appearance-none"
                defaultValue=""
              >
                <option value="" disabled>בחר קטגוריה...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            ) : categories.length > 0 ? (
              <>
                <input type="hidden" name="category_id" value={categories[0].id} />
                <div className="flex items-center gap-2 h-10 px-3 rounded-xl border bg-muted/50">
                  {categories[0].color && (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: categories[0].color }} />
                  )}
                  <span className="text-sm font-medium">{categories[0].name}</span>
                  <span className="text-[10px] text-muted-foreground mr-auto">🔒 נעול</span>
                </div>
              </>
            ) : (
              <div className="h-10 px-3 rounded-xl border bg-muted/50 flex items-center text-sm text-muted-foreground">
                לא הוגדרה קטגוריה
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>קבלה / חשבונית</Label>
            <ReceiptUpload onFileSelect={setFile} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'שולח...' : 'הגש הוצאה'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
