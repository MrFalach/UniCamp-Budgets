'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const EXPENSE_RULES = [
  { icon: '✅', text: 'הוצאות שקשורות ישירות לבניית הקמפ ופעילותו' },
  { icon: '✅', text: 'ציוד, חומרים, קישוטים, תאורה, מזון לקמפ' },
  { icon: '✅', text: 'חשוב לצרף קבלה/חשבונית לכל הוצאה' },
  { icon: '⛔', text: 'הוצאות אישיות שלא קשורות לקמפ' },
  { icon: '⛔', text: 'אלכוהול, סיגריות, ודברים שאמא שלך לא תאשר' },
  { icon: '⛔', text: 'הוצאות ללא קבלה — בלי קבלה, בלי כסף' },
  { icon: '💡', text: 'לא בטוחים? שלחו ותקבלו תשובה. עדיף לשאול מלהפסיד' },
]

export function ExpenseRulesButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        📋 חוקי הוצאות
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>מה מגישים ומה לא</DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {EXPENSE_RULES.map((rule, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 text-sm"
              >
                <span className="text-lg shrink-0 mt-0.5">{rule.icon}</span>
                <span>{rule.text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            שאלות? פנו למנהל המערכת.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
