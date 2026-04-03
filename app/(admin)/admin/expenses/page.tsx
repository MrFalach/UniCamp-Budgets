import { getCamps } from '@/lib/actions/camps'
import { getExpenseCategories } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/server'
import { AdminExpensesClient } from './AdminExpensesClient'

export default async function AdminExpensesPage() {
  const supabase = await createClient()

  const [camps, categories, { data: users }] = await Promise.all([
    getCamps(),
    getExpenseCategories(),
    supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name'),
  ])

  return (
    <AdminExpensesClient
      camps={camps ?? []}
      categories={categories}
      users={users ?? []}
    />
  )
}
