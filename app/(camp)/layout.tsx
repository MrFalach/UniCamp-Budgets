import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/MobileNav'
import { CampBottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { signOut } from '@/lib/actions/users'
import { CreditLine } from '@/components/CreditLine'

export default async function CampLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !profile.is_active) redirect('/login?reason=inactive')
  if (profile.role !== 'camp') redirect('/admin')

  const { data: settings } = await supabase.from('app_settings').select('event_name').eq('id', 1).single()

  const navItems = [
    { href: '/camp/dashboard', label: 'דשבורד' },
    { href: '/camp/expenses', label: 'הוצאות' },
    { href: '/camp/reimbursement', label: 'החזר' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-lg border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2.5">
                <img src="/unicamp-logo.jpeg" alt="UniCamp" className="w-8 h-8 rounded-lg object-cover shadow-sm animate-magnetic-drift" />
                <span className="font-bold text-lg hidden sm:inline">{settings?.event_name ?? 'UniCamp 2026'}</span>
              </div>
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/camp/dashboard">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">דשבורד</Button>
                </Link>
                <Link href="/camp/expenses">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">הוצאות</Button>
                </Link>
                <Link href="/camp/reimbursement">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">החזר</Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold avatar-ring">
                  {(profile.full_name ?? profile.email ?? 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{profile.full_name ?? profile.email}</span>
              </div>
              <form action={signOut} className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-muted-foreground">יציאה</Button>
              </form>
              <MobileNav
                items={navItems}
                eventName={settings?.event_name ?? 'UniCamp 2026'}
                userName={profile.full_name ?? profile.email ?? 'User'}
                signOutAction={signOut}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>
      <footer className="hidden md:flex justify-center fixed bottom-2 left-0 right-0 z-30 pointer-events-none">
        <CreditLine />
      </footer>
      <CampBottomNav />
    </div>
  )
}
