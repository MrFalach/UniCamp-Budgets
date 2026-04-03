'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { ReimbursementDialog } from '@/components/ReimbursementDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { closeSeason, reopenSeason } from '@/lib/actions/reimbursements'
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/lib/utils'
import { toast } from 'sonner'
import type { Reimbursement, SeasonStatus } from '@/lib/types'

interface Props {
  reimbursements: Reimbursement[]
  seasonStatus: SeasonStatus
}

export function ReimbursementsClient({ reimbursements, seasonStatus }: Props) {
  const [closeOpen, setCloseOpen] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)
  const [payTarget, setPayTarget] = useState<Reimbursement | null>(null)
  const [editTarget, setEditTarget] = useState<Reimbursement | null>(null)
  const [loading, setLoading] = useState(false)

  const totalAmount = reimbursements.reduce((s, r) => s + Number(r.total_amount), 0)
  const paidAmount = reimbursements.filter((r) => r.status === 'paid').reduce((s, r) => s + Number(r.total_amount), 0)
  const remainingAmount = totalAmount - paidAmount
  const paidPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  async function handleCloseSeason() {
    setLoading(true)
    try {
      await closeSeason()
      toast.success('העונה נסגרה בהצלחה')
      setCloseOpen(false)
    } catch (err) {
      toast.error('שגיאה בסגירת העונה')
    } finally {
      setLoading(false)
    }
  }

  async function handleReopenSeason() {
    setLoading(true)
    try {
      await reopenSeason()
      toast.success('העונה נפתחה מחדש')
      setReopenOpen(false)
    } catch {
      toast.error('שגיאה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">סגירת עונה והחזרים</h2>
          <p className="text-sm text-muted-foreground mt-1">ניהול החזרים כספיים לקמפים</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${seasonStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
          >
            {seasonStatus === 'active' ? '🟢 עונה פעילה' : '⏸️ עונה סגורה'}
          </Badge>
          {seasonStatus === 'active' ? (
            <Button variant="destructive" onClick={() => setCloseOpen(true)}>סגור עונה</Button>
          ) : (
            <Button variant="outline" onClick={() => setReopenOpen(true)}>פתח עונה מחדש</Button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {reimbursements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border bg-blue-50 border-blue-200">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">סה״כ להחזר</p>
              <p className="text-2xl font-bold font-mono text-blue-700">{formatCurrency(totalAmount)}</p>
            </CardContent>
          </Card>
          <Card className="border bg-emerald-50 border-emerald-200">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">שולם</p>
              <p className="text-2xl font-bold font-mono text-emerald-700">{formatCurrency(paidAmount)}</p>
            </CardContent>
          </Card>
          <Card className="border bg-amber-50 border-amber-200">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">נותר לתשלום</p>
              <p className="text-2xl font-bold font-mono text-amber-700">{formatCurrency(remainingAmount)}</p>
            </CardContent>
          </Card>
          <Card className="border bg-violet-50 border-violet-200">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">הושלם</p>
              <p className="text-2xl font-bold font-mono text-violet-700">{paidPercent.toFixed(0)}%</p>
              <Progress value={paidPercent} className="h-2 mt-2 [&>div]:bg-emerald-500" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reimbursements table */}
      {reimbursements.length > 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>קמפ</TableHead>
                  <TableHead>סכום לגביה</TableHead>
                  <TableHead>פרטי בנק</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>אמצעי תשלום</TableHead>
                  <TableHead>אסמכתא</TableHead>
                  <TableHead>תאריך תשלום</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reimbursements.map((r) => {
                  const camp = r.camp as Record<string, unknown> | undefined
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{(camp?.name as string) ?? '—'}</TableCell>
                      <TableCell className="font-mono">{formatCurrency(r.total_amount)}</TableCell>
                      <TableCell className="text-sm">
                        {camp?.bank_account_name ? (
                          <span>
                            {(camp.bank_name as string) ?? ''} {(camp.bank_branch as string) ?? ''} / {(camp.bank_account_number as string) ?? ''}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">חסר</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-sm">{getPaymentMethodLabel(r.payment_method)}</TableCell>
                      <TableCell dir="ltr" className="text-sm">{r.payment_reference ?? '—'}</TableCell>
                      <TableCell className="text-sm">{r.paid_at ? formatDate(r.paid_at) : '—'}</TableCell>
                      <TableCell>
                        {r.status === 'pending' ? (
                          <Button size="sm" onClick={() => setPayTarget(r)}>סמן כשולם</Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setEditTarget(r)}>ערוך</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {seasonStatus === 'active'
              ? 'רשומות החזר ייווצרו אוטומטית עם סגירת העונה.'
              : 'אין רשומות החזר.'}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="סגירת עונה"
        description="לאחר סגירת העונה לא ניתן להגיש הוצאות חדשות. קמפים יוכלו לצפות בהוצאות בלבד. רשומות החזר ייווצרו אוטומטית."
        onConfirm={handleCloseSeason}
        confirmLabel="סגור עונה"
        variant="destructive"
      />

      <ConfirmDialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        title="פתיחת עונה מחדש"
        description="האם אתה בטוח? קמפים יוכלו שוב להגיש הוצאות."
        onConfirm={handleReopenSeason}
        confirmLabel="פתח מחדש"
      />

      {payTarget && (
        <ReimbursementDialog
          reimbursement={payTarget}
          open={!!payTarget}
          onOpenChange={(open) => !open && setPayTarget(null)}
          mode="pay"
        />
      )}

      {editTarget && (
        <ReimbursementDialog
          reimbursement={editTarget}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          mode="edit"
        />
      )}
    </div>
  )
}
