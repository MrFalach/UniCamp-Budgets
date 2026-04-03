import { getAppSettings, getExpenseCategories, getAuditLogs } from '@/lib/actions/settings'
import { SettingsClient } from './SettingsClient'

export default async function AdminSettingsPage() {
  const [settings, categories, { logs, total }] = await Promise.all([
    getAppSettings(),
    getExpenseCategories(),
    getAuditLogs({ perPage: 50 }),
  ])

  return (
    <SettingsClient
      settings={settings}
      categories={categories}
      auditLogs={logs}
      auditTotal={total}
    />
  )
}
