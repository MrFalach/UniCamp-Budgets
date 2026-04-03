'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateCampBankDetails } from '@/lib/actions/camps'
import { toast } from 'sonner'
import type { Camp } from '@/lib/types'

export function CampBankForm({ camp }: { camp: Camp }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      await updateCampBankDetails(camp.id, new FormData(e.currentTarget))
      toast.success('פרטי הבנק עודכנו')
    } catch {
      toast.error('שגיאה בעדכון פרטי הבנק')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="bank_account_name">שם בעל החשבון</Label>
          <Input id="bank_account_name" name="bank_account_name" defaultValue={camp.bank_account_name ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_account_number">מספר חשבון</Label>
          <Input id="bank_account_number" name="bank_account_number" defaultValue={camp.bank_account_number ?? ''} dir="ltr" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_name">שם הבנק</Label>
          <Input id="bank_name" name="bank_name" defaultValue={camp.bank_name ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_branch">סניף</Label>
          <Input id="bank_branch" name="bank_branch" defaultValue={camp.bank_branch ?? ''} dir="ltr" />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'שומר...' : 'שמור פרטי בנק'}
      </Button>
    </form>
  )
}
