'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { ExpenseDetailDialog } from '@/components/ExpenseDetailDialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ExpenseWithRelations, ExpenseStatus } from '@/lib/types'

interface CampExpensesListProps {
  expenses: ExpenseWithRelations[]
  seasonClosed?: boolean
}

export function CampExpensesList({ expenses, seasonClosed = false }: CampExpensesListProps) {
  const [filter, setFilter] = useState<ExpenseStatus | 'all'>('all')
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithRelations | null>(null)

  const filtered = filter === 'all'
    ? expenses
    : expenses.filter((e) => e.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">הוצאות</h2>
        {!seasonClosed && (
          <Link href="/camp/new-expense">
            <Button>+ הגש הוצאה חדשה</Button>
          </Link>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as ExpenseStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="all">הכל ({expenses.length})</TabsTrigger>
          <TabsTrigger value="pending">ממתין ({expenses.filter((e) => e.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="approved">אושר ({expenses.filter((e) => e.status === 'approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">נדחה ({expenses.filter((e) => e.status === 'rejected').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">אין הוצאות</p>
          ) : (
            <div className="divide-y">
              {filtered.map((expense) => (
                <button
                  key={expense.id}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-start"
                  onClick={() => setSelectedExpense(expense)}
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={expense.status} />
                    <div>
                      <p className="text-sm font-medium">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.category?.name ?? '—'} · {formatDate(expense.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-medium">{formatCurrency(expense.amount)}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseDetailDialog
        expense={selectedExpense}
        open={!!selectedExpense}
        onOpenChange={(open) => !open && setSelectedExpense(null)}
      />
    </div>
  )
}
