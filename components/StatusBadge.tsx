import { Badge } from '@/components/ui/badge'
import { getStatusLabel } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={`${statusStyles[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'} ${className ?? ''}`}>
      {getStatusLabel(status)}
    </Badge>
  )
}
