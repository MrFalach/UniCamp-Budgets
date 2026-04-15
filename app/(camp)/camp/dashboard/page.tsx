import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { StatusBadge } from '@/components/StatusBadge'
import { WelcomeOverlay } from '@/components/WelcomeOverlay'
import { ExpenseRulesButton } from '@/components/ExpenseRulesDialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getUserCamp, getCampWithBudget, getCampCategories } from '@/lib/actions/camps'
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

  const { data: profile } = await supabase.from('profiles').select('has_seen_welcome').eq('id', user.id).single()
  const showWelcome = !profile?.has_seen_welcome

  const budget = await getCampWithBudget(camp.id)
  const seasonClosed = settings.season_status === 'closed'

  // Per-category breakdown for productions
  let categoryBreakdown: { id: string; name: string; color: string | null; budget_cap: number; approved: number; pending: number }[] = []
  if (camp.type === 'production') {
    const campCategories = await getCampCategories(camp.id)
    const { data: catExpenses } = await supabase
      .from('expenses')
      .select('category_id, amount, status')
      .eq('camp_id', camp.id)

    categoryBreakdown = campCategories.map((cat) => {
      const catExp = catExpenses?.filter((e) => e.category_id === cat.id) ?? []
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        budget_cap: cat.budget_cap ?? 0,
        approved: catExp.filter((e) => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0),
        pending: catExp.filter((e) => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0),
      }
    })
  }

  const { data: recentExpenses } = await supabase
    .from('expenses')
    .select('id, amount, description, status, submitted_at')
    .eq('camp_id', camp.id)
    .order('submitted_at', { ascending: false })
    .limit(5)

  // Shitim advance is an out-of-pocket payment by the camp that will be reimbursed —
  // it does not reduce the gifting budget and is shown separately below.
  const utilized = budget.total_approved

  const metrics = [
    { label: 'תקציב כולל', value: formatCurrency(budget.total_budget), color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-400' },
    { label: 'אושר', value: formatCurrency(budget.total_approved), color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'ממתין', value: formatCurrency(budget.total_pending), color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', textColor: 'text-amber-700 dark:text-amber-400' },
    { label: 'נותר', value: formatCurrency(budget.remaining), color: 'bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800', textColor: 'text-violet-700 dark:text-violet-400' },
  ]

  return (
    <div className="space-y-8">
      {showWelcome && (
        <WelcomeOverlay
          campName={camp.name}
          totalBudget={budget.total_budget}
          campType={camp.type}
        />
      )}

      {seasonClosed && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 rounded-lg p-4 text-sm flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          העונה נסגרה — ניתן לצפות בהוצאות בלבד
        </div>
      )}

      {budget.usage_percent >= settings.budget_warning_threshold && !seasonClosed && (
        <div className="bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300 rounded-lg p-4 text-sm flex items-center gap-3 animate-fade-in">
          <span className="text-lg">🚨</span>
          <div>
            <p className="font-semibold">התקציב עומד להיגמר!</p>
            <p className="text-xs mt-0.5 opacity-80">ניצלתם {budget.usage_percent.toFixed(0)}% מהתקציב. נותרו {formatCurrency(budget.remaining)} בלבד.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between relative">
        <div>
          <h2 className="text-2xl font-bold">{camp.name}</h2>
          <p className="text-muted-foreground mt-1 animate-clip-reveal">סקירת תקציב הקמפ</p>
        </div>
        <div className="flex items-center gap-2">
          <ExpenseRulesButton />
          {!seasonClosed && (
            <Link href="/camp/new-expense">
              <Button>+ הגש הוצאה חדשה</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Budget metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-cards">
        {metrics.map((m) => (
          <Card key={m.label} className={`border ${m.color} hover-lift tilt-hover`}>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-2xl font-bold font-mono ${m.textColor}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <BudgetProgressBar
        total={budget.total_budget}
        used={utilized}
        threshold={settings.budget_warning_threshold}
      />

      {/* Shitim advance — shown when camp paid one. Money the camp paid out-of-pocket,
          treated as an already-approved invoice awaiting reimbursement. */}
      {budget.shitim_advance > 0 && (
        <Card className="shadow-sm border-sky-200 bg-sky-50/50 dark:bg-sky-950/20 dark:border-sky-800">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🛟</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-sky-900 dark:text-sky-200">מקדמה שיטים — ממתין להחזר</p>
                  <p className="font-mono font-bold text-lg text-sky-700 dark:text-sky-300">
                    {formatCurrency(budget.shitim_advance)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  סכום ששילמתם ישירות לאירוע כמקדמה לשיטים. אינו מנוצל מתקציב הגיפטינג — ייחשב כהוצאה מאושרת ויוחזר לכם בסגירת העונה.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-category breakdown for productions */}
      {camp.type === 'production' && categoryBreakdown.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">פירוט לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => {
                const remaining = cat.budget_cap - cat.approved
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color ?? '#6B7280' }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span>אושר: {formatCurrency(cat.approved)}</span>
                        {cat.pending > 0 && <span className="text-amber-600">ממתין: {formatCurrency(cat.pending)}</span>}
                        <span>נותר: {formatCurrency(remaining)}</span>
                      </div>
                    </div>
                    <BudgetProgressBar
                      total={cat.budget_cap}
                      used={cat.approved}
                      threshold={settings.budget_warning_threshold}
                      showLabels={false}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent expenses */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">הוצאות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentExpenses || recentExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין הוצאות עדיין</p>
          ) : (
            <div className="space-y-1 stagger-rows">
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
