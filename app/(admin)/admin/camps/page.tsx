import { getAllCampsWithBudgets, getCampsWithUsers, getTakenProductionCategoryIds, getCampCategories } from '@/lib/actions/camps'
import { getAppSettings, getExpenseCategories } from '@/lib/actions/settings'
import { AdminCampsClient } from './AdminCampsClient'

export default async function AdminCampsPage() {
  const [campBudgets, productionBudgets, campsWithUsers, productionsWithUsers, settings, allCategories, takenProductionCategoryIds] = await Promise.all([
    getAllCampsWithBudgets('camp'),
    getAllCampsWithBudgets('production'),
    getCampsWithUsers('camp'),
    getCampsWithUsers('production'),
    getAppSettings(),
    getExpenseCategories(),
    getTakenProductionCategoryIds(),
  ])

  // Build email lookup for both camps and productions
  const campEmails: Record<string, string | null> = {}
  for (const c of [...campsWithUsers, ...productionsWithUsers]) {
    campEmails[c.id] = c.user_email
  }

  // Build category assignments per production (for display + editing)
  const productionCategoryMap: Record<string, string[]> = {}
  for (const { camp } of productionBudgets) {
    const cats = await getCampCategories(camp.id)
    productionCategoryMap[camp.id] = cats.map((c) => c.id)
  }

  // Gifting budget cap for warning
  const giftingCategory = allCategories.find((c) => c.name === 'גיפטינג')
  const giftingBudgetCap = giftingCategory?.budget_cap ?? 0
  const totalCampBudgets = campBudgets.reduce((sum, { camp }) => sum + camp.total_budget, 0)

  // Shitim advance guardrail: sum across camps vs category cap
  const shitimCategory = allCategories.find((c) => c.name === 'מקדמה לשיטים')
  const shitimCategoryCap = shitimCategory?.budget_cap ?? 0
  const totalShitimAdvances = campBudgets.reduce((sum, { shitim_advance }) => sum + (shitim_advance ?? 0), 0)

  return (
    <AdminCampsClient
      campBudgets={campBudgets}
      productionBudgets={productionBudgets}
      campEmails={campEmails}
      threshold={settings.budget_warning_threshold}
      allCategories={allCategories}
      takenProductionCategoryIds={takenProductionCategoryIds}
      productionCategoryMap={productionCategoryMap}
      giftingBudgetCap={giftingBudgetCap}
      totalCampBudgets={totalCampBudgets}
      shitimCategoryCap={shitimCategoryCap}
      totalShitimAdvances={totalShitimAdvances}
    />
  )
}
