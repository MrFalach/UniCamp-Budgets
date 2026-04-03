import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserCamp } from '@/lib/actions/camps'
import { CampExpensesList } from './CampExpensesList'

export default async function CampExpensesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const camp = await getUserCamp(user.id)
  if (!camp) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">לא משויך לקמפ</p>
      </div>
    )
  }

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, category:expense_categories(id, name, color)')
    .eq('camp_id', camp.id)
    .order('submitted_at', { ascending: false })

  return <CampExpensesList expenses={expenses ?? []} />
}
