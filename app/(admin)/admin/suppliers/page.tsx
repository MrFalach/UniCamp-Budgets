import { getAllCampsWithBudgets, getCampsWithUsers } from '@/lib/actions/camps'
import { getAppSettings, getExpenseCategories } from '@/lib/actions/settings'
import { AdminSuppliersClient } from './AdminSuppliersClient'

export default async function AdminSuppliersPage() {
  const [supplierBudgets, suppliersWithUsers, settings, categories] = await Promise.all([
    getAllCampsWithBudgets('supplier'),
    getCampsWithUsers('supplier'),
    getAppSettings(),
    getExpenseCategories(),
  ])

  const supplierEmails: Record<string, string | null> = {}
  for (const s of suppliersWithUsers) {
    supplierEmails[s.id] = s.user_email
  }

  return (
    <AdminSuppliersClient
      supplierBudgets={supplierBudgets}
      supplierEmails={supplierEmails}
      threshold={settings.budget_warning_threshold}
      allCategories={categories}
    />
  )
}
