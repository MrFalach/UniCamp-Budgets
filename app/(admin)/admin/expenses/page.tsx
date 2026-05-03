import { getAllCampsAndSuppliers } from '@/lib/actions/camps'
import { getExpenseCategories } from '@/lib/actions/settings'
import { getFilteredExpenses } from '@/lib/actions/expenses'
import { createClient } from '@/lib/supabase/server'
import { AdminExpensesClient } from './AdminExpensesClient'
import type { ExpenseStatus } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string; perPage?: string }>
}

export default async function AdminExpensesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const status = (params.status as ExpenseStatus | 'all' | undefined) ?? 'all'
  const page = Number(params.page ?? '1')
  const perPage = Number(params.perPage ?? '25')
  const search = params.search

  const [camps, categories, { data: users }, initialExpenses] = await Promise.all([
    getAllCampsAndSuppliers(),
    getExpenseCategories(),
    supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name'),
    getFilteredExpenses({ search, status, page, perPage }),
  ])

  return (
    <AdminExpensesClient
      camps={camps ?? []}
      categories={categories}
      users={users ?? []}
      initialExpenses={initialExpenses.expenses}
      initialTotal={initialExpenses.total}
      initialFilters={{ search, status, page, perPage }}
    />
  )
}
