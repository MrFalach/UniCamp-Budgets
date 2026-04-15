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
import type { Camp, CampBudgetSummary, ExpenseCategory } from '@/lib/types'

interface Props {
  campBudgets: CampBudgetSummary[]
  productionBudgets: CampBudgetSummary[]
  campEmails: Record<string, string | null>
  threshold: number
  allCategories: ExpenseCategory[]
  takenProductionCategoryIds: string[]
  productionCategoryMap: Record<string, string[]>
  giftingBudgetCap: number
  totalCampBudgets: number
  shitimCategoryCap: number
  totalShitimAdvances: number
}

export function AdminCampsClient({
  campBudgets,
  productionBudgets,
  campEmails,
  threshold,
  allCategories,
  takenProductionCategoryIds,
  productionCategoryMap,
  giftingBudgetCap,
  totalCampBudgets,
  shitimCategoryCap,
  totalShitimAdvances,
}: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editCamp, setEditCamp] = useState<Camp | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Camp | null>(null)

  // Productions first, then camps
  const allBudgets = [...productionBudgets, ...campBudgets]

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteCamp(deleteTarget.id)
      toast.success(deleteTarget.type === 'production' ? 'ההפקה נמחקה' : 'הקמפ נמחק')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה במחיקה')
    }
  }

  function getLabel(camp: Camp) {
    return camp.type === 'production' ? 'הפקה' : 'קמפ'
  }

  function getCategoryNames(campId: string) {
    const catIds = productionCategoryMap[campId] ?? []
    return catIds.map((id) => allCategories.find((c) => c.id === id)).filter(Boolean) as ExpenseCategory[]
  }

  const giftingOverBudget = giftingBudgetCap > 0 && totalCampBudgets > giftingBudgetCap

  // Soft guardrail: sum of per-camp shitim advances should match the category's budget cap.
  const shitimMismatch = shitimCategoryCap > 0 && Math.abs(totalShitimAdvances - shitimCategoryCap) > 0.5

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">הפקות וקמפים</h2>
          <p className="text-sm text-muted-foreground mt-1">ניהול הפקות, קמפים ותקציבים</p>
        </div>
        <Button onClick={() => { setEditCamp(null); setFormOpen(true) }}>+ חדש</Button>
      </div>

      {/* Gifting budget warning */}
      {giftingOverBudget && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
          <span className="shrink-0">⚠️</span>
          <span>
            סה&quot;כ תקציבי קמפים ({formatCurrency(totalCampBudgets)}) חורג מתקציב גיפטינג ({formatCurrency(giftingBudgetCap)}).
            כדאי להגדיל את תקציב קטגוריית גיפטינג בהגדרות.
          </span>
        </div>
      )}

      {/* Shitim advance mismatch warning */}
      {shitimMismatch && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-800 flex items-start gap-2">
          <span className="shrink-0">🛟</span>
          <span>
            סכום מקדמות השיטים מכל הקמפים ({formatCurrency(totalShitimAdvances)}) לא תואם את תקציב קטגוריית &quot;מקדמה לשיטים&quot; ({formatCurrency(shitimCategoryCap)}).
            עדכן את הסכום בפרופיל הקמפים או את תקציב הקטגוריה בהגדרות.
          </span>
        </div>
      )}

      {/* Mobile card view */}
      <div className="md:hidden space-y-3 stagger-cards">
        {allBudgets.length === 0 ? (
          <EmptyState icon="camps" title="אין הפקות או קמפים עדיין" description="צור הפקה או קמפ חדש כדי להתחיל" />
        ) : (
          allBudgets.map(({ camp, total_approved, remaining, usage_percent, shitim_advance }) => (
            <Card key={camp.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{camp.type === 'production' ? '🎬' : '🏕️'}</span>
                    <span className="font-semibold text-base">{camp.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={camp.type === 'production' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                      {getLabel(camp)}
                    </Badge>
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
                </div>
                {/* Category breakdown for productions */}
                {camp.type === 'production' && (
                  <div className="flex flex-wrap gap-1">
                    {getCategoryNames(camp.id).map((cat) => (
                      <span key={cat.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted/50 text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color ?? '#6B7280' }} />
                        {cat.name}
                        {cat.budget_cap != null && cat.budget_cap > 0 && (
                          <span className="font-mono">{formatCurrency(cat.budget_cap)}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[11px] text-muted-foreground">תקציב</p>
                    <p className="font-mono text-sm font-medium">{formatCurrency(camp.total_budget)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2">
                    <p className="text-[11px] text-muted-foreground">מאושר</p>
                    <p className="font-mono text-sm font-medium text-emerald-600">{formatCurrency(total_approved)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-[11px] text-muted-foreground">נותר</p>
                    <p className="font-mono text-sm font-medium">{formatCurrency(remaining)}</p>
                  </div>
                </div>
                {shitim_advance > 0 && (
                  <div className="bg-sky-50 dark:bg-sky-950/20 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-[11px] text-sky-900 dark:text-sky-200 flex items-center gap-1">
                      🛟 מקדמה שיטים
                    </span>
                    <span className="font-mono text-sm font-medium text-sky-700 dark:text-sky-300">
                      {formatCurrency(shitim_advance)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BudgetProgressBar total={camp.total_budget} used={total_approved + shitim_advance} threshold={threshold} showLabels={false} />
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
                          const url = await resendInvite(campEmails[camp.id]!, camp.id)
                          if (url) {
                            await navigator.clipboard.writeText(url)
                            toast.success('לינק הזמנה הועתק!')
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
                <TableHead>סוג</TableHead>
                <TableHead>שם</TableHead>
                <TableHead>משתמש</TableHead>
                <TableHead>תקציב</TableHead>
                <TableHead>מאושר</TableHead>
                <TableHead>מקדמה שיטים</TableHead>
                <TableHead>נותר</TableHead>
                <TableHead className="w-[180px]">ניצול</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="w-[120px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBudgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState icon="camps" title="אין הפקות או קמפים עדיין" description="צור הפקה או קמפ חדש כדי להתחיל" />
                  </TableCell>
                </TableRow>
              ) : (
                allBudgets.map(({ camp, total_approved, remaining, usage_percent, shitim_advance }) => (
                  <TableRow key={camp.id}>
                    <TableCell>
                      <Badge variant="outline" className={camp.type === 'production' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                        {camp.type === 'production' ? '🎬 הפקה' : '🏕️ קמפ'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-semibold">{camp.name}</span>
                        {camp.type === 'production' && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getCategoryNames(camp.id).map((cat) => (
                              <span key={cat.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-muted/50 text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color ?? '#6B7280' }} />
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span dir="ltr" className="text-sm text-muted-foreground">
                        {campEmails[camp.id] ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatCurrency(camp.total_budget)}</TableCell>
                    <TableCell className="font-mono text-sm text-emerald-600">{formatCurrency(total_approved)}</TableCell>
                    <TableCell className="font-mono text-sm text-sky-600">
                      {shitim_advance > 0 ? formatCurrency(shitim_advance) : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{formatCurrency(remaining)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BudgetProgressBar total={camp.total_budget} used={total_approved + shitim_advance} threshold={threshold} showLabels={false} />
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
                                const url = await resendInvite(campEmails[camp.id]!, camp.id)
                                if (url) {
                                  await navigator.clipboard.writeText(url)
                                  toast.success('לינק הזמנה הועתק!')
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
        key={editCamp?.id ?? 'new'}
        camp={editCamp}
        campEmail={editCamp ? campEmails[editCamp.id] : null}
        open={formOpen}
        onOpenChange={setFormOpen}
        allCategories={allCategories}
        takenProductionCategoryIds={takenProductionCategoryIds}
        assignedCategoryIds={editCamp ? (productionCategoryMap[editCamp.id] ?? []) : []}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.type === 'production' ? 'מחיקת הפקה' : 'מחיקת קמפ'}
        description={`האם אתה בטוח שברצונך למחוק את "${deleteTarget?.name}"? לא ניתן למחוק ${deleteTarget?.type === 'production' ? 'הפקה' : 'קמפ'} שיש לו הוצאות.`}
        onConfirm={handleDelete}
        confirmLabel="מחק"
        variant="destructive"
      />
    </div>
  )
}
