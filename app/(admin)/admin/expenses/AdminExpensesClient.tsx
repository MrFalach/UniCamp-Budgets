'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/StatusBadge'
import { ExpenseDetailDialog } from '@/components/ExpenseDetailDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  getFilteredExpenses,
  bulkUpdateExpenseStatus,
  adminCreateExpense,
} from '@/lib/actions/expenses'
import { formatCurrency, formatDate } from '@/lib/utils'
import { exportExpensesToExcel } from '@/lib/export'
import { toast } from 'sonner'
import type { Camp, ExpenseCategory, ExpenseWithRelations, ExpenseFilters, ExpenseStatus } from '@/lib/types'

interface Props {
  camps: Camp[]
  categories: ExpenseCategory[]
  users: { id: string; full_name: string | null; email: string | null }[]
}

export function AdminExpensesClient({ camps, categories, users }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Filter state from URL
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState<ExpenseStatus | 'all'>((searchParams.get('status') as ExpenseStatus) ?? 'all')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))
  const [perPage, setPerPage] = useState(Number(searchParams.get('perPage') ?? '25'))

  // Data
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Dialogs
  const [detailExpense, setDetailExpense] = useState<ExpenseWithRelations | null>(null)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)
  const [bulkRejectNote, setBulkRejectNote] = useState('')
  const [manualExpenseOpen, setManualExpenseOpen] = useState(false)

  const filters: ExpenseFilters = {
    search: search || undefined,
    status,
    page,
    perPage,
  }

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getFilteredExpenses(filters)
      setExpenses(result.expenses)
      setTotal(result.total)
    } catch {
      toast.error('שגיאה בטעינת הוצאות')
    } finally {
      setLoading(false)
    }
  }, [search, status, page, perPage])

  useEffect(() => {
    const timeout = setTimeout(fetchExpenses, search ? 300 : 0)
    return () => clearTimeout(timeout)
  }, [fetchExpenses])

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    if (page > 1) params.set('page', String(page))
    if (perPage !== 25) params.set('perPage', String(perPage))
    const url = params.toString() ? `?${params.toString()}` : '/admin/expenses'
    window.history.replaceState({}, '', url)
  }, [search, status, page, perPage])

  const pendingCount = expenses.filter((e) => e.status === 'pending').length
  const approvedCount = expenses.filter((e) => e.status === 'approved').length
  const rejectedCount = expenses.filter((e) => e.status === 'rejected').length
  const totalPages = Math.ceil(total / perPage)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === expenses.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(expenses.map((e) => e.id)))
    }
  }

  async function handleBulkApprove() {
    const ids = Array.from(selected)
    try {
      const result = await bulkUpdateExpenseStatus(ids, 'approved')
      toast.success(`${result.affected} הוצאות אושרו`)
      setSelected(new Set())
      fetchExpenses()
    } catch {
      toast.error('שגיאה באישור')
    }
  }

  async function handleBulkReject() {
    const ids = Array.from(selected)
    try {
      const result = await bulkUpdateExpenseStatus(ids, 'rejected', bulkRejectNote)
      toast.success(`${result.affected} הוצאות נדחו`)
      setSelected(new Set())
      setBulkRejectOpen(false)
      setBulkRejectNote('')
      fetchExpenses()
    } catch {
      toast.error('שגיאה בדחייה')
    }
  }

  function handleExportExcel() {
    exportExpensesToExcel(expenses, `expenses-${new Date().toISOString().split('T')[0]}`)
    toast.success('הקובץ הורד')
  }

  async function handleManualExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      await adminCreateExpense(formData)
      toast.success('הוצאה נוספה')
      setManualExpenseOpen(false)
      fetchExpenses()
    } catch {
      toast.error('שגיאה בהוספת הוצאה')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">הוצאות</h2>
        <p className="text-sm text-muted-foreground mt-1">
          צפייה, סינון ואישור הוצאות מכל הקמפים
        </p>
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 font-medium">
          סה״כ: <span className="font-mono">{total}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 font-medium">
          ממתינות: <span className="font-mono">{pendingCount}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 font-medium">
          מאושרות: <span className="font-mono">{approvedCount}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700 font-medium">
          נדחו: <span className="font-mono">{rejectedCount}</span>
        </span>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="חיפוש תיאור, קמפ..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-64"
            />

            <Tabs value={status} onValueChange={(v) => { setStatus(v as ExpenseStatus | 'all'); setPage(1) }}>
              <TabsList>
                <TabsTrigger value="all">הכל</TabsTrigger>
                <TabsTrigger value="pending">ממתין</TabsTrigger>
                <TabsTrigger value="approved">אושר</TabsTrigger>
                <TabsTrigger value="rejected">נדחה</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus('all'); setPage(1) }}>
              נקה סינונים
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <span className="text-sm text-muted-foreground self-center">
            {total} תוצאות
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            יצוא Excel
          </Button>
          <Button size="sm" onClick={() => setManualExpenseOpen(true)}>
            + הוצאה ידנית
          </Button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
          <span className="text-sm font-medium">{selected.size} נבחרו</span>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleBulkApprove}>
            אשר נבחרים
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setBulkRejectOpen(true)}>
            דחה נבחרים
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            בטל בחירה
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={expenses.length > 0 && selected.size === expenses.length}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>קמפ</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead className="max-w-[200px]">תיאור</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>הגיש</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>קבלה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                      <p className="text-sm">טוען...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <span className="text-3xl">📋</span>
                      <p className="text-sm font-medium">אין הוצאות להצגה</p>
                      <p className="text-xs">נסה לשנות את הסינונים או להוסיף הוצאה חדשה</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDetailExpense(expense)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(expense.id)}
                        onChange={() => toggleSelect(expense.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {expense.camp?.name ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-mono font-medium ${expense.status === 'approved' ? 'text-emerald-600' : ''}`}>
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={expense.description}>
                      {expense.description}
                    </TableCell>
                    <TableCell className="text-sm">
                      {expense.category?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {expense.submitter?.full_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {formatDate(expense.submitted_at)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={expense.status} />
                    </TableCell>
                    <TableCell>
                      {expense.receipt_url ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">שורות בעמוד:</span>
                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1) }}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  הקודם
                </Button>
                <span className="text-sm font-medium tabular-nums px-2">
                  עמוד {page} מתוך {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  הבא
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense detail dialog */}
      <ExpenseDetailDialog
        expense={detailExpense}
        open={!!detailExpense}
        onOpenChange={(open) => {
          if (!open) {
            setDetailExpense(null)
            fetchExpenses()
          }
        }}
        isAdmin
      />

      {/* Bulk reject dialog */}
      <Dialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דחה {selected.size} הוצאות</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="סיבת הדחייה..."
            value={bulkRejectNote}
            onChange={(e) => setBulkRejectNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setBulkRejectOpen(false)}>ביטול</Button>
            <Button variant="destructive" onClick={handleBulkReject}>דחה</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual expense dialog */}
      <Dialog open={manualExpenseOpen} onOpenChange={setManualExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוצאה ידנית</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualExpense} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">קמפ *</label>
              <Select name="camp_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="בחר קמפ" />
                </SelectTrigger>
                <SelectContent>
                  {camps.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">סכום (₪) *</label>
              <Input name="amount" type="number" min={0} step={0.01} required dir="ltr" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">תיאור *</label>
              <Textarea name="description" required rows={2} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">קטגוריה</label>
              <Select name="category_id">
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setManualExpenseOpen(false)}>ביטול</Button>
              <Button type="submit">הוסף (מאושר אוטומטית)</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
