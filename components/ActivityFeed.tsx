'use client'

import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'

interface AuditEntry {
  id: string
  action: string
  entity_type: string | null
  created_at: string
  actor?: { full_name: string | null } | null
}

interface ActivityFeedProps {
  logs: AuditEntry[]
}

const actionLabels: Record<string, { label: string; color: string; dot: string }> = {
  'expense.created': { label: 'הגיש הוצאה', color: 'text-blue-600', dot: 'bg-blue-500' },
  'expense.approved': { label: 'אישר הוצאה', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  'expense.rejected': { label: 'דחה הוצאה', color: 'text-red-600', dot: 'bg-red-500' },
  'expense.deleted': { label: 'מחק הוצאה', color: 'text-gray-600', dot: 'bg-gray-500' },
  'camp.created': { label: 'יצר קמפ', color: 'text-violet-600', dot: 'bg-violet-500' },
  'camp.updated': { label: 'עדכן קמפ', color: 'text-violet-600', dot: 'bg-violet-500' },
  'camp.deleted': { label: 'מחק קמפ', color: 'text-gray-600', dot: 'bg-gray-500' },
  'user.invited': { label: 'הזמין משתמש', color: 'text-blue-600', dot: 'bg-blue-500' },
  'user.updated': { label: 'עדכן משתמש', color: 'text-blue-600', dot: 'bg-blue-500' },
  'season.closed': { label: 'סגר עונה', color: 'text-amber-600', dot: 'bg-amber-500' },
  'season.reopened': { label: 'פתח עונה', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  'reimbursement.paid': { label: 'סימן כשולם', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  'settings.updated': { label: 'עדכן הגדרות', color: 'text-gray-600', dot: 'bg-gray-500' },
  'category.created': { label: 'יצר קטגוריה', color: 'text-violet-600', dot: 'bg-violet-500' },
}

function getActionInfo(action: string) {
  return actionLabels[action] ?? { label: action, color: 'text-muted-foreground', dot: 'bg-muted-foreground' }
}

export function ActivityFeed({ logs }: ActivityFeedProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">אין פעילות אחרונה</p>
  }

  return (
    <ol className="space-y-0 list-none p-0 m-0" aria-label="פעילות אחרונה">
      {logs.map((log, i) => {
        const info = getActionInfo(log.action)
        const actor = log.actor as { full_name?: string | null } | null | undefined
        const actorName = actor?.full_name ?? 'מערכת'
        return (
          <li key={log.id} className="flex gap-3 py-2.5 relative">
            {/* Timeline line */}
            {i < logs.length - 1 && (
              <div className="absolute start-[7px] top-[22px] bottom-0 w-px bg-border" />
            )}
            {/* Dot */}
            <div className={`w-[15px] h-[15px] rounded-full ${info.dot} mt-0.5 shrink-0 ring-2 ring-background`} />
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{actorName}</span>{' '}
                <span className={info.color}>{info.label}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: he })}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
