'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/audit'

export async function getAppSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateAppSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: old } = await supabase.from('app_settings').select('*').eq('id', 1).single()

  const eventName = formData.get('event_name') as string
  const eventYear = Number(formData.get('event_year'))
  const budgetWarningThreshold = Number(formData.get('budget_warning_threshold'))

  const { error } = await supabase
    .from('app_settings')
    .update({
      event_name: eventName,
      event_year: eventYear,
      budget_warning_threshold: budgetWarningThreshold,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) throw new Error(error.message)

  await logAction(user.id, 'settings_updated', 'app_settings', undefined, old as Record<string, unknown>, {
    event_name: eventName,
    event_year: eventYear,
    budget_warning_threshold: budgetWarningThreshold,
  })

  revalidatePath('/')
}

export async function getExpenseCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('sort_order')

  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const color = formData.get('color') as string | null
  const budgetCap = formData.get('budget_cap') ? Number(formData.get('budget_cap')) : null

  const { error } = await supabase
    .from('expense_categories')
    .insert({ name, color: color || null, budget_cap: budgetCap })

  if (error) throw new Error(error.message)

  revalidatePath('/admin/settings')
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const color = formData.get('color') as string | null
  const budgetCap = formData.get('budget_cap') ? Number(formData.get('budget_cap')) : null

  const { error } = await supabase
    .from('expense_categories')
    .update({ name, color: color || null, budget_cap: budgetCap })
    .eq('id', categoryId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/settings')
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/settings')
}

export async function getAuditLogs(filters?: {
  actorId?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  perPage?: number
}) {
  const supabase = await createClient()

  const page = filters?.page ?? 1
  const perPage = filters?.perPage ?? 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('audit_logs')
    .select('*, actor:profiles(id, full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters?.actorId) query = query.eq('actor_id', filters.actorId)
  if (filters?.action) query = query.eq('action', filters.action)
  if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters?.dateTo) query = query.lte('created_at', filters.dateTo)

  query = query.range(from, to)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return { logs: data ?? [], total: count ?? 0 }
}
