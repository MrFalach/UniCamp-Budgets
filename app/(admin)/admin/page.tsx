import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { ActivityFeed } from '@/components/ActivityFeed'
import { getAllCampsWithBudgets } from '@/lib/actions/camps'
import { getAppSettings, getAuditLogs } from '@/lib/actions/settings'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [campBudgets, settings, { logs: recentLogs }] = await Promise.all([
    getAllCampsWithBudgets(),
    getAppSettings(),
    getAuditLogs({ perPage: 10 }),
  ])

  const totalBudget = campBudgets.reduce((s, c) => s + Number(c.camp.total_budget), 0)
  const totalApproved = campBudgets.reduce((s, c) => s + c.total_approved, 0)
  const totalPending = campBudgets.reduce((s, c) => s + c.total_pending, 0)
  const totalRemaining = totalBudget - totalApproved

  const metrics = [
    { label: 'סה״כ תקציב', value: formatCurrency(totalBudget), color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-400' },
    { label: 'הוצאות מאושרות', value: formatCurrency(totalApproved), color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'יתרה כוללת', value: formatCurrency(totalRemaining), color: 'bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800', textColor: 'text-violet-700 dark:text-violet-400' },
    { label: 'ממתינות לאישור', value: formatCurrency(totalPending), color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-400' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold gradient-text">דשבורד ניהול</h2>
        <p className="text-muted-foreground mt-1">סקירה כללית של תקציבי הקמפים</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        {metrics.map((m) => (
          <Card key={m.label} className={`border ${m.color} hover-lift`}>
            <CardContent className="pt-4 pb-3 sm:pt-5 sm:pb-4">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-lg sm:text-2xl font-bold font-mono ${m.textColor}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
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
              <span className="bg-white/20 text-xs rounded-full px-1.5 py-0.5 ms-2">!</span>
            )}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camp budget list */}
        <Card className="shadow-sm lg:col-span-2">
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

        {/* Activity feed */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">פעילות אחרונה</CardTitle>
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">הכל</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityFeed logs={recentLogs} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
