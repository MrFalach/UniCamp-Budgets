'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { MenuIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  badge?: number | null
  icon?: string
}

interface MobileNavProps {
  items: NavItem[]
  eventName: string
  userName: string
  seasonStatus?: 'active' | 'closed'
  signOutAction?: () => void
}

export function MobileNav({ items, eventName, userName, seasonStatus, signOutAction }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="md:hidden" />
        }
      >
        <MenuIcon className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/unicamp-logo.jpeg" alt="UniCamp" className="w-8 h-8 rounded-lg object-cover" />
              <SheetTitle>{eventName}</SheetTitle>
            </div>
            {seasonStatus && (
              <Badge
                variant={seasonStatus === 'active' ? 'default' : 'secondary'}
                className={`text-[10px] ${seasonStatus === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}`}
              >
                {seasonStatus === 'active' ? 'פעיל' : 'סגור'}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4 flex-1">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/camp/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <SheetClose key={item.href} render={<div />}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              </SheetClose>
            )
          })}
        </nav>

        <div className="border-t p-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{userName}</span>
            </div>
            {signOutAction && (
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">יציאה</Button>
              </form>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
