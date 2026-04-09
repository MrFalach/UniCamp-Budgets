'use client'

import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ExpenseWithRelations } from '@/lib/types'

interface SwipeableExpenseCardProps {
  expense: ExpenseWithRelations
  selected: boolean
  onToggleSelect: () => void
  onTap: () => void
  onApprove?: () => void
  onReject?: () => void
}

export function SwipeableExpenseCard({
  expense,
  selected,
  onToggleSelect,
  onTap,
  onApprove,
  onReject,
}: SwipeableExpenseCardProps) {
  const startX = useRef(0)
  const currentX = useRef(0)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const threshold = 80

  const isPending = expense.status === 'pending'

  function handleTouchStart(e: React.TouchEvent) {
    if (!isPending) return
    startX.current = e.touches[0].clientX
    currentX.current = startX.current
    setSwiping(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!swiping || !isPending) return
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current
    // Limit swipe range with rubber-band effect
    const clamped = Math.sign(diff) * Math.min(Math.abs(diff), 140)
    setOffset(clamped)
  }

  function handleTouchEnd() {
    if (!swiping || !isPending) return
    setSwiping(false)

    if (offset > threshold && onApprove) {
      onApprove()
    } else if (offset < -threshold && onReject) {
      onReject()
    }
    setOffset(0)
  }

  const approveOpacity = Math.min(Math.max(offset / threshold, 0), 1)
  const rejectOpacity = Math.min(Math.max(-offset / threshold, 0), 1)

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe backgrounds */}
      {isPending && (
        <>
          <div
            className="absolute inset-y-0 start-0 w-full flex items-center justify-start ps-5 bg-emerald-500 rounded-lg"
            style={{ opacity: approveOpacity }}
          >
            <span className="text-white font-bold text-sm">אישור ✓</span>
          </div>
          <div
            className="absolute inset-y-0 end-0 w-full flex items-center justify-end pe-5 bg-red-500 rounded-lg"
            style={{ opacity: rejectOpacity }}
          >
            <span className="text-white font-bold text-sm">✗ דחייה</span>
          </div>
        </>
      )}

      {/* Card */}
      <Card
        className={`shadow-sm relative transition-transform border-s-4 ${
          expense.status === 'approved' ? 'border-s-emerald-500' :
          expense.status === 'rejected' ? 'border-s-red-500' :
          'border-s-amber-500'
        } ${!swiping ? 'transition-transform duration-300' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !swiping && Math.abs(offset) < 5 && onTap()}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                onClick={(e) => e.stopPropagation()}
                className="rounded"
              />
              <Badge variant="outline" className="text-xs">
                {expense.camp?.name ?? '—'}
              </Badge>
            </div>
            <StatusBadge status={expense.status} />
          </div>
          <p className="text-sm line-clamp-2 mb-2">{expense.description}</p>
          <div className="flex items-center justify-between">
            <span className={`font-mono font-semibold text-lg ${expense.status === 'approved' ? 'text-emerald-600' : ''}`}>
              {formatCurrency(expense.amount)}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{expense.submitter?.full_name ?? '—'}</span>
              <span className="font-mono">{formatDate(expense.submitted_at)}</span>
              {expense.receipt_url && <span className="text-emerald-600">📎</span>}
            </div>
          </div>
          {isPending && (
            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">← החלק לאישור / דחייה →</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
