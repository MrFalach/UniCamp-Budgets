import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BudgetProgressBar } from '@/components/BudgetProgressBar'
import { ActivityFeed } from '@/components/ActivityFeed'
import { CollapsibleCard } from '@/components/CollapsibleCard'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { ScrollReveal } from '@/components/ScrollReveal'
import { TypewriterText } from '@/components/TypewriterText'
import { getAllCampsWithBudgets } from '@/lib/actions/camps'
import { getAppSettings, getAuditLogs } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user!.id).single()

  const [campBudgets, settings, { logs: recentLogs }] = await Promise.all([
    getAllCampsWithBudgets(),
    getAppSettings(),
    getAuditLogs({ perPage: 10 }),
  ])

  const totalBudget = campBudgets.reduce((s, c) => s + Number(c.camp.total_budget), 0)
  const totalApproved = campBudgets.reduce((s, c) => s + c.total_approved, 0)
  const totalPending = campBudgets.reduce((s, c) => s + c.total_pending, 0)
  const totalShitimAdvance = campBudgets.reduce((s, c) => s + (c.shitim_advance ?? 0), 0)
  const totalUtilized = totalApproved + totalShitimAdvance
  const totalRemaining = totalBudget - totalUtilized

  const greeting = profile?.full_name ? `שלום, ${profile.full_name}` : 'דשבורד ניהול'

  const metrics = [
    { label: 'סה״כ תקציב', rawValue: totalBudget, color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 shadow-blue', textColor: 'text-blue-700 dark:text-blue-400' },
    { label: 'נוצל מהתקציב', rawValue: totalUtilized, color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 shadow-emerald', textColor: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'יתרה כוללת', rawValue: totalRemaining, color: 'bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800 shadow-violet', textColor: 'text-violet-700 dark:text-violet-400' },
    { label: 'ממתינות לאישור', rawValue: totalPending, color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 shadow-amber', textColor: 'text-amber-700 dark:text-amber-400' },
  ]

  return (
    <div className="space-y-8 animate-fade-in dot-pattern min-h-screen -mx-4 sm:-mx-6 px-4 sm:px-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">
          <TypewriterText text={greeting} speed={50} />
        </h2>
        <p className="text-muted-foreground mt-1 animate-clip-reveal">סקירה כללית של תקציבי הקמפים והספקים</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 stagger-cards">
        {metrics.map((m) => (
          <Card key={m.label} className={`border ${m.color} hover-lift tilt-hover`}>
            <CardContent className="pt-4 pb-3 sm:pt-5 sm:pb-4">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1">{m.label}</p>
              <p className={`text-lg sm:text-2xl font-bold font-mono ${m.textColor}`}>
                <AnimatedCounter value={m.rawValue} prefix="₪" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/camps">
          <Button variant="outline" className="border-dashed">+ קמפ חדש</Button>
        </Link>
        <Link href="/admin/suppliers">
          <Button variant="outline" className="border-dashed">+ ספק חדש</Button>
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

      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camp budget list */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">קמפים וספקים — ניצול תקציב</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {campBudgets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">אין קמפים עדיין</p>
              ) : (
                campBudgets.map(({ camp, total_approved, shitim_advance }) => {
                  const utilized = total_approved + (shitim_advance ?? 0)
                  return (
                    <div key={camp.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Link href={camp.type === 'supplier' ? '/admin/suppliers' : `/admin/camps`} className="font-semibold hover:text-primary transition-colors">
                            {camp.name}
                          </Link>
                          {camp.type === 'supplier' && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-600 border-violet-200">ספק</Badge>
                          )}
                          {shitim_advance > 0 && (
                            <span title={`מקדמה שיטים: ₪${shitim_advance.toLocaleString('he-IL')}`} className="text-sky-500">🛟</span>
                          )}
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">
                          ₪{utilized.toLocaleString('he-IL')} / ₪{camp.total_budget.toLocaleString('he-IL')}
                        </span>
                      </div>
                      <BudgetProgressBar
                        total={camp.total_budget}
                        used={utilized}
                        threshold={settings.budget_warning_threshold}
                        showLabels={false}
                      />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Activity feed — collapsible */}
          <CollapsibleCard
            title="פעילות אחרונה"
            className="shadow-sm"
            headerAction={
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">הכל</Button>
              </Link>
            }
          >
            <ActivityFeed logs={recentLogs} />
          </CollapsibleCard>
        </div>
      </ScrollReveal>
    </div>
  )
}
