import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getUserCamp, getCampWithBudget } from '@/lib/actions/camps'
import { getAppSettings } from '@/lib/actions/settings'
import Link from 'next/link'

export default async function CampDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const settings = await getAppSettings()
  const camp = await getUserCamp(user.id)

  if (!camp) {
    return (
      <div className="text-center py-20">
        <span className="text-4xl mb-4 block">🏕️</span>
        <h2 className="text-xl font-semibold mb-2">לא משויך לקמפ</h2>
        <p className="text-muted-foreground">פנה למנהל המערכת לשיוך לקמפ.</p>
      </div>
    )
  }

  const budget = await getCampWithBudget(camp.id)
  const seasonClosed = settings.season_status === 'closed'

  const { data: recentExpenses } = await supabase
    .from('expenses')
    .select('id, amount, description, status, submitted_at')
    .eq('camp_id', camp.id)
    .order('submitted_at', { ascending: false })
    .limit(5)

  const metrics = [
    { label: 'תקציב כולל', value: formatCurrency(budget.total_budget), color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
    { label: 'אושר', value: formatCurrency(budget.total_approved), color: 'bg-emerald-50 border-emerald-200', textColor: 'text-emerald-700' },
    { label: 'ממתין', value: formatCurrency(budget.total_pending), color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
    { label: 'נותר', value: formatCurrency(budget.remaining), color: 'bg-violet-50 border-violet-200', textColor: 'text-violet-700' },
  ]

  return (
    <div className="space-y-8">
      {seasonClosed && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          העונה נסגרה — ניתן לצפות בהוצאות בלבד
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{camp.name}</h2>
          <p className="text-muted-foreground mt-1">סקירת תקציב הקמפ</p>
        </div>
        {!seasonClosed && (
          <Link href="/camp/new-expense">
            <Button>+ הגש הוצאה חדשה</Button>
          </Link>
        )}
      </div>

      {/* Budget metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className={`border ${m.color}`}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-2xl font-bold font-mono ${m.textColor}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <BudgetProgressBar
        total={budget.total_budget}
        used={budget.total_approved}
        threshold={settings.budget_warning_threshold}
      />

      {/* Recent expenses */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">הוצאות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentExpenses || recentExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין הוצאות עדיין</p>
          ) : (
            <div className="space-y-1">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={expense.status} />
                    <span className="text-sm">{expense.description}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-medium text-sm">{formatCurrency(expense.amount)}</span>
                    <span className="text-xs text-muted-foreground font-mono">{formatDate(expense.submitted_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/camp/expenses" className="block mt-4">
            <Button variant="outline" size="sm" className="w-full">צפה בכל ההוצאות</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
