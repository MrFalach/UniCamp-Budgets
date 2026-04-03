import { getReimbursements } from '@/lib/actions/reimbursements'
import { getAppSettings } from '@/lib/actions/settings'
import { ReimbursementsClient } from './ReimbursementsClient'

export default async function AdminReimbursementsPage() {
  const [reimbursements, settings] = await Promise.all([
    getReimbursements(),
    getAppSettings(),
  ])

  return (
    <ReimbursementsClient
      reimbursements={reimbursements}
      seasonStatus={settings.season_status}
    />
  )
}
