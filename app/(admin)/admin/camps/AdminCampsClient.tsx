'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/EmptyState'
import { CampFormDialog } from '@/components/CampFormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { deleteCamp } from '@/lib/actions/camps'
import { resendInvite } from '@/lib/actions/users'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { Camp, CampBudgetSummary } from '@/lib/types'

interface Props {
  campBudgets: CampBudgetSummary[]
  campEmails: Record<string, string | null>
  threshold: number
}

export function AdminCampsClient({ campBudgets, campEmails, threshold }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editCamp, setEditCamp] = useState<Camp | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Camp | null>(null)

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCamp(deleteTarget.id)
      toast.success('הקמפ נמחק')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה במחיקת הקמפ')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">קמפים</h2>
          <p className="text-sm text-muted-foreground mt-1">ניהול קמפים ותקציבים</p>
        </div>
        <Button onClick={() => { setEditCamp(null); setFormOpen(true) }}>+ קמפ חדש</Button>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3 stagger-children">
        {campBudgets.length === 0 ? (
          <EmptyState icon="camps" title="אין קמפים עדיין" description="צור קמפ חדש כדי להתחיל" />
        ) : (
          campBudgets.map(({ camp, total_approved, remaining, usage_percent }) => (
            <Card key={camp.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base">{camp.name}</span>
                  <Badge
                    variant="outline"
                    className={camp.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                    }
                  >
                    {camp.is_active ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">תקציב</p>
                    <p className="font-mono text-sm font-medium">{formatCurrency(camp.total_budget)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">מאושר</p>
                    <p className="font-mono text-sm font-medium text-emerald-600">{formatCurrency(total_approved)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">נותר</p>
                    <p className="font-mono text-sm font-medium">{formatCurrency(remaining)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BudgetProgressBar total={camp.total_budget} used={total_approved} threshold={threshold} showLabels={false} />
                  <span className="text-xs text-muted-foreground font-mono w-10">{usage_percent.toFixed(0)}%</span>
                </div>
                <div className="flex gap-1 pt-1 border-t">
                  {campEmails[camp.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary hover:text-primary flex-1"
                      onClick={async () => {
                        try {
                          const url = await resendInvite(campEmails[camp.id]!)
                          if (url) {
                            await navigator.clipboard.writeText(url)
                            toast.success('לינק הזמנה הועתק!', { description: 'שלח אותו למנהל הקמפ' })
                          }
                        } catch {
                          toast.error('שגיאה ביצירת לינק הזמנה')
                        }
                      }}
                    >
                      העתק לינק
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs flex-1" onClick={() => { setEditCamp(camp); setFormOpen(true) }}>
                    ערוך
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive flex-1" onClick={() => setDeleteTarget(camp)}>
                    מחק
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="shadow-sm hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>שם</TableHead>
                <TableHead>משתמש</TableHead>
                <TableHead>תקציב</TableHead>
                <TableHead>מאושר</TableHead>
                <TableHead>נותר</TableHead>
                <TableHead className="w-[180px]">ניצול</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="w-[120px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campBudgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState icon="camps" title="אין קמפים עדיין" description="צור קמפ חדש כדי להתחיל" />
                  </TableCell>
                </TableRow>
              ) : (
                campBudgets.map(({ camp, total_approved, remaining, usage_percent }) => (
                  <TableRow key={camp.id}>
                    <TableCell>
                      <span className="font-semibold">{camp.name}</span>
                    </TableCell>
                    <TableCell>
                      <span dir="ltr" className="text-sm text-muted-foreground">
                        {campEmails[camp.id] ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatCurrency(camp.total_budget)}</TableCell>
                    <TableCell className="font-mono text-sm text-emerald-600">{formatCurrency(total_approved)}</TableCell>
                    <TableCell className="font-mono text-sm">{formatCurrency(remaining)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BudgetProgressBar total={camp.total_budget} used={total_approved} threshold={threshold} showLabels={false} />
                        <span className="text-xs text-muted-foreground font-mono w-10">{usage_percent.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={camp.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                        }
                      >
                        {camp.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {campEmails[camp.id] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary"
                            onClick={async () => {
                              try {
                                const url = await resendInvite(campEmails[camp.id]!)
                                if (url) {
                                  await navigator.clipboard.writeText(url)
                                  toast.success('לינק הזמנה הועתק!', { description: 'שלח אותו למנהל הקמפ' })
                                }
                              } catch {
                                toast.error('שגיאה ביצירת לינק הזמנה')
                              }
                            }}
                          >
                            העתק לינק
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => { setEditCamp(camp); setFormOpen(true) }}
                        >
                          ערוך
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(camp)}
                        >
                          מחק
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CampFormDialog
        camp={editCamp}
        campEmail={editCamp ? campEmails[editCamp.id] : null}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="מחיקת קמפ"
        description={`האם אתה בטוח שברצונך למחוק את "${deleteTarget?.name}"? לא ניתן למחוק קמפ שיש לו הוצאות.`}
        onConfirm={handleDelete}
        confirmLabel="מחק"
        variant="destructive"
      />
    </div>
  )
}
