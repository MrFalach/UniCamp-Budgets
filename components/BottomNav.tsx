'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboardIcon, ReceiptTextIcon, WalletIcon, UsersIcon, BarChart3Icon, TentIcon, PlusCircleIcon, PackageIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number | null
}

interface BottomNavProps {
  items: NavItem[]
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav role="navigation" aria-label="ניווט ראשי" className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-lg border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/camp/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <span className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -end-2.5 bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 inset-x-4 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Pre-built nav configs
export function AdminBottomNav({ pendingCount }: { pendingCount?: number | null }) {
  const items: NavItem[] = [
    { href: '/admin', label: 'דשבורד', icon: <LayoutDashboardIcon className="h-5 w-5" /> },
    { href: '/admin/expenses', label: 'הוצאות', icon: <ReceiptTextIcon className="h-5 w-5" />, badge: pendingCount },
    { href: '/admin/camps', label: 'קמפים', icon: <TentIcon className="h-5 w-5" /> },
    { href: '/admin/suppliers', label: 'ספקים', icon: <PackageIcon className="h-5 w-5" /> },
    { href: '/admin/analytics', label: 'אנליטיקס', icon: <BarChart3Icon className="h-5 w-5" /> },
  ]
  return <BottomNav items={items} />
}

export function CampBottomNav() {
  const items: NavItem[] = [
    { href: '/camp/dashboard', label: 'דשבורד', icon: <LayoutDashboardIcon className="h-5 w-5" /> },
    { href: '/camp/new-expense', label: 'הוצאה חדשה', icon: <PlusCircleIcon className="h-5 w-5" /> },
    { href: '/camp/expenses', label: 'הוצאות', icon: <ReceiptTextIcon className="h-5 w-5" /> },
    { href: '/camp/reimbursement', label: 'החזר', icon: <WalletIcon className="h-5 w-5" /> },
  ]
  return <BottomNav items={items} />
}
