import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { signOut } from '@/lib/actions/users'
import { getAppSettings } from '@/lib/actions/settings'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/camp/dashboard')

  const settings = await getAppSettings()

  const { count: pendingCount } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const navItems = [
    { href: '/admin', label: 'דשבורד' },
    { href: '/admin/expenses', label: 'הוצאות', badge: pendingCount },
    { href: '/admin/camps', label: 'קמפים' },
    { href: '/admin/users', label: 'משתמשים' },
    { href: '/admin/analytics', label: 'אנליטיקס' },
    { href: '/admin/reimbursements', label: 'החזרים' },
    { href: '/admin/settings', label: 'הגדרות' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">🔥</span>
                </div>
                <span className="font-bold text-lg">{settings.event_name}</span>
                <Badge
                  variant={settings.season_status === 'active' ? 'default' : 'secondary'}
                  className={`text-[10px] ${settings.season_status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}`}
                >
                  {settings.season_status === 'active' ? 'פעיל' : 'סגור'}
                </Badge>
              </div>
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent relative">
                      {item.label}
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -start-1 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                  {(profile.full_name ?? profile.email ?? 'A').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{profile.full_name ?? profile.email}</span>
              </div>
              <form action={signOut}>
                <Button variant="ghost" size="sm" className="text-muted-foreground">יציאה</Button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
