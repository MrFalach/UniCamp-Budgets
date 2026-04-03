'use client'

import { Progress } from '@/components/ui/progress'
import { getBudgetColor, formatCurrency } from '@/lib/utils'

interface BudgetProgressBarProps {
  total: number
  used: number
  threshold?: number
  showLabels?: boolean
}

export function BudgetProgressBar({ total, used, threshold = 80, showLabels = true }: BudgetProgressBarProps) {
  const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0
  const color = getBudgetColor(percent, threshold)

  const colorClass =
    color === 'red' ? '[&>div]:bg-red-500' :
    color === 'amber' ? '[&>div]:bg-amber-500' :
    '[&>div]:bg-emerald-500'

  const bgClass =
    color === 'red' ? 'bg-red-100' :
    color === 'amber' ? 'bg-amber-100' :
    'bg-emerald-100'

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
            {percent.toFixed(0)}%
          </span>
        </div>
      )}
      <Progress value={percent} className={`h-2.5 rounded-full ${bgClass} ${colorClass}`} />
    </div>
  )
}
