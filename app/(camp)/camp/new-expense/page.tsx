'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ReceiptUpload } from '@/components/ReceiptUpload'
import { submitExpense } from '@/lib/actions/expenses'
import { getExpenseCategories } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ExpenseCategory } from '@/lib/types'

export default function NewExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [campId, setCampId] = useState<string | null>(null)

  useEffect(() => {
    getExpenseCategories().then(setCategories)

    // Get user's camp
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('camp_members')
          .select('camp_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) setCampId(data.camp_id)
          })
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!campId) {
      toast.error('לא משויך לקמפ')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      let receiptUrl: string | null = null
      let receiptType: string | null = null

      if (file) {
        const supabase = createClient()
        const ext = file.name.split('.').pop()
        const path = `${campId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(path, file)

        if (uploadError) throw uploadError

        const { data: urlData } = await supabase.storage
          .from('receipts')
          .createSignedUrl(path, 3600)

        receiptUrl = urlData?.signedUrl ?? null
        receiptType = file.type.startsWith('image/') ? 'image' : 'pdf'
      }
      formData.set('camp_id', campId)
      if (receiptUrl) formData.set('receipt_url', receiptUrl)
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

          <div className="space-y-2">
            <Label>קטגוריה</Label>
            <Select name="category_id">
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
