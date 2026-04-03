import { createClient } from '@/lib/supabase/server'
import { getAllCampsWithBudgets } from '@/lib/actions/camps'
import { getExpenseCategories } from '@/lib/actions/settings'
import { AnalyticsClient } from './AnalyticsClient'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const [campBudgets, categories, { data: expenses }] = await Promise.all([
    getAllCampsWithBudgets(),
    getExpenseCategories(),
    supabase
      .from('expenses')
      .select('id, camp_id, amount, status, category_id, submitted_at')
      .order('submitted_at'),
  ])

  return (
    <AnalyticsClient
      campBudgets={campBudgets}
      categories={categories}
      expenses={expenses ?? []}
    />
  )
}
