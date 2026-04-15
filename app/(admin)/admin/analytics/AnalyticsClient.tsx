'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { formatCurrency } from '@/lib/utils'
import type { CampBudgetSummary, ExpenseCategory } from '@/lib/types'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280', '#EC4899', '#14B8A6']

interface Expense {
  id: string
  camp_id: string
  amount: number
  status: string
  category_id: string | null
  submitted_at: string
}

interface Props {
  campBudgets: CampBudgetSummary[]
  categories: ExpenseCategory[]
  expenses: Expense[]
}

export function AnalyticsClient({ campBudgets, categories, expenses }: Props) {
  // Total shitim advance across all camps — treated as already-spent on the "מקדמה לשיטים" category
  const totalShitimAdvance = useMemo(
    () => campBudgets.reduce((s, c) => s + (c.shitim_advance ?? 0), 0),
    [campBudgets]
  )

  // Bar chart: expenses per camp
  const campChartData = useMemo(() =>
    campBudgets.map(({ camp, total_approved, total_pending, total_rejected, shitim_advance }) => ({
      name: camp.name,
      אושר: total_approved,
      'מקדמה שיטים': shitim_advance ?? 0,
      ממתין: total_pending,
      נדחה: total_rejected,
    })),
    [campBudgets]
  )

  // Pie chart: by category (shitim advance counts as spend under "מקדמה לשיטים")
  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    expenses
      .filter((e) => e.status === 'approved')
      .forEach((e) => {
        const catName = categories.find((c) => c.id === e.category_id)?.name ?? 'אחר'
        map.set(catName, (map.get(catName) ?? 0) + Number(e.amount))
      })
    if (totalShitimAdvance > 0) {
      map.set('מקדמה לשיטים', (map.get('מקדמה לשיטים') ?? 0) + totalShitimAdvance)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [expenses, categories, totalShitimAdvance])

  // Line chart: cumulative by week
  const weeklyData = useMemo(() => {
    const approved = expenses
      .filter((e) => e.status === 'approved')
      .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())

    if (approved.length === 0) return []

    const weeks = new Map<string, number>()
    let cumulative = 0
    approved.forEach((e) => {
      const date = new Date(e.submitted_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const key = weekStart.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })
      cumulative += Number(e.amount)
      weeks.set(key, cumulative)
    })

    return Array.from(weeks.entries()).map(([week, total]) => ({ week, total }))
  }, [expenses])

  // Budget utilization sorted by % desc
  const sortedBudgets = [...campBudgets].sort((a, b) => b.usage_percent - a.usage_percent)

  // Category overspend — shitim advance counts as spend on its own category
  const categoryOverspend = useMemo(() => {
    return categories
      .filter((c) => c.budget_cap && c.budget_cap > 0)
      .map((cat) => {
        let spent = expenses
          .filter((e) => e.status === 'approved' && e.category_id === cat.id)
          .reduce((s, e) => s + Number(e.amount), 0)
        if (cat.name === 'מקדמה לשיטים') spent += totalShitimAdvance
        return { ...cat, spent, over: spent > (cat.budget_cap ?? 0) }
      })
      .filter((c) => c.over)
  }, [categories, expenses, totalShitimAdvance])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">אנליטיקס</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">הוצאות לפי קמפ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campChartData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="אושר" stackId="a" fill="#10B981" />
                <Bar dataKey="מקדמה שיטים" stackId="a" fill="#0EA5E9" />
                <Bar dataKey="ממתין" stackId="a" fill="#F59E0B" />
                <Bar dataKey="נדחה" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פירוט לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">הוצאות מאושרות לאורך זמן (מצטבר)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget utilization table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ניצול תקציב</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>קמפ</TableHead>
                <TableHead>תקציב</TableHead>
                <TableHead>הוצאות</TableHead>
                <TableHead>נותר</TableHead>
                <TableHead>אחוז</TableHead>
                <TableHead className="w-[200px]">ניצול</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBudgets.map(({ camp, total_approved, remaining, usage_percent, shitim_advance }) => {
                const utilized = total_approved + (shitim_advance ?? 0)
                return (
                  <TableRow key={camp.id}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1">
                        {camp.name}
                        {shitim_advance > 0 && <span title={`מקדמה שיטים: ${formatCurrency(shitim_advance)}`} className="text-sky-500">🛟</span>}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(camp.total_budget)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(utilized)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(remaining)}</TableCell>
                    <TableCell>{usage_percent.toFixed(0)}%</TableCell>
                    <TableCell>
                      <BudgetProgressBar
                        total={camp.total_budget}
                        used={utilized}
                        showLabels={false}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Camp comparison */}
      {campBudgets.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">השוואת קמפים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedBudgets.map(({ camp, total_approved, usage_percent, shitim_advance }, index) => (
                <div key={camp.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{index + 1}</span>
                      <span className="font-medium">{camp.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-emerald-600">{formatCurrency(total_approved + (shitim_advance ?? 0))}</span>
                      <span className="text-muted-foreground">/ {formatCurrency(camp.total_budget)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          usage_percent >= 90 ? 'bg-red-500' :
                          usage_percent >= 70 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(usage_percent, 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground/70">
                        {usage_percent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category overspend alerts */}
      {categoryOverspend.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg text-red-600">חריגה בקטגוריות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryOverspend.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="font-medium">{cat.name}</span>
                  <div className="text-sm">
                    <span className="text-red-600 font-mono">{formatCurrency(cat.spent)}</span>
                    <span className="text-muted-foreground"> / {formatCurrency(cat.budget_cap!)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
