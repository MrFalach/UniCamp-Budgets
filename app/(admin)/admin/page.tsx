import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { getAllCampsWithBudgets } from '@/lib/actions/camps'
import { getAppSettings } from '@/lib/actions/settings'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [campBudgets, settings] = await Promise.all([
    getAllCampsWithBudgets(),
    getAppSettings(),
  ])

  const totalBudget = campBudgets.reduce((s, c) => s + Number(c.camp.total_budget), 0)
  const totalApproved = campBudgets.reduce((s, c) => s + c.total_approved, 0)
  const totalPending = campBudgets.reduce((s, c) => s + c.total_pending, 0)
  const totalRemaining = totalBudget - totalApproved

  const metrics = [
    { label: 'סה״כ תקציב', value: formatCurrency(totalBudget), color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
    { label: 'הוצאות מאושרות', value: formatCurrency(totalApproved), color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
    { label: 'יתרה כוללת', value: formatCurrency(totalRemaining), color: 'bg-violet-50 border-violet-200', textColor: 'text-violet-700' },
    { label: 'ממתינות לאישור', value: formatCurrency(totalPending), color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">דשבורד ניהול</h2>
        <p className="text-muted-foreground mt-1">סקירה כללית של תקציבי הקמפים</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className={`border ${m.color}`}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-2xl font-bold font-mono ${m.textColor}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/admin/camps">
          <Button variant="outline" className="border-dashed">+ קמפ חדש</Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="outline" className="border-dashed">+ משתמש חדש</Button>
        </Link>
        <Link href="/admin/expenses?status=pending">
          <Button className="bg-primary hover:bg-primary/90">
            עבור להוצאות ממתינות
            {totalPending > 0 && (
              <span className="bg-white/20 text-xs rounded-full px-1.5 py-0.5 ms-2">{campBudgets.reduce((s, c) => s + c.total_pending, 0) > 0 ? '!' : ''}</span>
            )}
          </Button>
        </Link>
      </div>

      {/* Camp budget list */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">קמפים — ניצול תקציב</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {campBudgets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">אין קמפים עדיין</p>
          ) : (
            campBudgets.map(({ camp, total_approved }) => (
              <div key={camp.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Link href={`/admin/camps/${camp.id}`} className="font-semibold hover:text-primary transition-colors">
                    {camp.name}
                  </Link>
                  <span className="text-muted-foreground font-mono text-xs">
                    {formatCurrency(total_approved)} / {formatCurrency(camp.total_budget)}
                  </span>
                </div>
                <BudgetProgressBar
                  total={camp.total_budget}
                  used={total_approved}
                  threshold={settings.budget_warning_threshold}
                  showLabels={false}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
