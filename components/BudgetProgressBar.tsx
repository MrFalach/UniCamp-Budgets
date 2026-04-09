'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { getBudgetColor, formatCurrency } from '@/lib/utils'

interface BudgetProgressBarProps {
  total: number
  used: number
  threshold?: number
  showLabels?: boolean
}

export function BudgetProgressBar({ total, used, threshold = 80, showLabels = true }: BudgetProgressBarProps) {
  const targetPercent = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    // Animate from 0 to target
    const timeout = setTimeout(() => setPercent(targetPercent), 50)
    return () => clearTimeout(timeout)
  }, [targetPercent])

  const color = getBudgetColor(percent, threshold)

  const colorClass =
    color === 'red' ? '[&>div]:bg-red-500' :
    color === 'amber' ? '[&>div]:bg-amber-500' :
    '[&>div]:bg-emerald-500'

  const bgClass =
    color === 'red' ? 'bg-red-100 dark:bg-red-950/30' :
    color === 'amber' ? 'bg-amber-100 dark:bg-amber-950/30' :
    'bg-emerald-100 dark:bg-emerald-950/30'

  return (
    <div className="space-y-1.5">
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-mono font-medium text-foreground">{formatCurrency(used)}</span> מתוך {formatCurrency(total)}
          </span>
          <span className={`font-mono font-medium ${
            color === 'red' ? 'text-red-600' :
            color === 'amber' ? 'text-amber-600' :
            'text-emerald-600'
          }`}>
            {targetPercent.toFixed(0)}%
          </span>
        </div>
      )}
      <Progress value={percent} className={`h-2.5 rounded-full ${bgClass} ${colorClass} [&>div>div]:transition-all [&>div>div]:duration-1000 [&>div>div]:ease-out`} />
    </div>
  )
}
