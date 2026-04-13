import { getAllCampsWithBudgets, getCampsWithUsers } from '@/lib/actions/camps'
import { getAppSettings } from '@/lib/actions/settings'
import { AdminCampsClient } from './AdminCampsClient'

export default async function AdminCampsPage() {
  const [campBudgets, campsWithUsers, settings] = await Promise.all([
    getAllCampsWithBudgets('camp'),
    getCampsWithUsers('camp'),
    getAppSettings(),
  ])

  const campEmails: Record<string, string | null> = {}
  for (const c of campsWithUsers) {
    campEmails[c.id] = c.user_email
  }

  return (
    <AdminCampsClient
      campBudgets={campBudgets}
      campEmails={campEmails}
      threshold={settings.budget_warning_threshold}
    />
  )
}
