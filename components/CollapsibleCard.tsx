'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon } from 'lucide-react'

interface CollapsibleCardProps {
  title: string
  headerAction?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function CollapsibleCard({ title, headerAction, children, defaultOpen = false, className }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <CardTitle className="text-lg">{title}</CardTitle>
            <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
          {headerAction}
        </div>
      </CardHeader>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </div>
      </div>
    </Card>
  )
}
