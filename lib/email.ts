import { createAdminClient } from '@/lib/supabase/admin'

type NotificationType =
  | 'expense_submitted'
  | 'expense_approved'
  | 'expense_rejected'
  | 'season_closed'
  | 'reimbursement_paid'

interface NotificationPayload {
  type: NotificationType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

export async function sendNotification(payload: NotificationPayload) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.functions.invoke('send-notification', {
      body: payload,
    })
    if (error) {
      console.error('Failed to send notification:', error)
    }
  } catch (err) {
    console.error('Email notification error:', err)
  }
}
