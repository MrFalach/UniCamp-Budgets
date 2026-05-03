import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserCampCategories, getUserCampType } from '@/lib/actions/camps'
import { NewExpenseForm } from './NewExpenseForm'

export default async function NewExpensePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [categories, campType, memberResult] = await Promise.all([
    getUserCampCategories(user.id),
    getUserCampType(user.id),
    supabase
      .from('camp_members')
      .select('camp_id')
      .eq('user_id', user.id)
      .limit(1)
      .single(),
  ])

  return (
    <NewExpenseForm
      categories={categories}
      campType={campType}
      campId={memberResult.data?.camp_id ?? null}
    />
  )
}
