'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/audit'
import { sendNotification } from '@/lib/email'
import type { ExpenseFilters, ExpenseWithRelations } from '@/lib/types'

export async function submitExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check season
  const { data: settings } = await supabase.from('app_settings').select('season_status').eq('id', 1).single()
  if (settings?.season_status === 'closed') throw new Error('העונה סגורה')

  const campId = formData.get('camp_id') as string
  const amount = Number(formData.get('amount'))
  const description = formData.get('description') as string
  let categoryId = formData.get('category_id') as string | null
  const receiptUrl = formData.get('receipt_url') as string | null
  const receiptType = formData.get('receipt_type') as string | null

  // Auto-assign category: camps → "גיפטינג", suppliers → their assigned category
  const { data: camp } = await supabase.from('camps').select('type, name').eq('id', campId).single()
  if (camp?.type === 'camp') {
    const { data: giftingCat } = await supabase
      .from('expense_categories')
      .select('id')
      .eq('name', 'גיפטינג')
      .single()
    if (giftingCat) categoryId = giftingCat.id
  } else if (camp?.type === 'supplier' && !categoryId) {
    const { data: assignedCat } = await supabase
      .from('camp_categories')
      .select('category_id')
      .eq('camp_id', campId)
      .limit(1)
      .single()
    if (assignedCat) categoryId = assignedCat.category_id
  }

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      camp_id: campId,
      submitted_by: user.id,
      amount,
      description,
      category_id: categoryId || null,
      receipt_url: receiptUrl || null,
      receipt_type: receiptType || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await sendNotification({
    type: 'expense_submitted',
    data: {
      expense_id: expense.id,
      camp_name: camp?.name,
      amount,
      description,
    },
  })

  revalidatePath('/camp')
  revalidatePath('/admin')
  return expense
}

export async function adminCreateExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const campId = formData.get('camp_id') as string
  const amount = Number(formData.get('amount'))
  const description = formData.get('description') as string
  const categoryId = formData.get('category_id') as string | null

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      camp_id: campId,
      submitted_by: user.id,
      amount,
      description,
      category_id: categoryId || null,
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await logAction(user.id, 'expense_created_by_admin', 'expense', expense.id, undefined, { amount, description })

  revalidatePath('/admin')
  return expense
}

export async function updateExpenseStatus(
  expenseId: string,
  status: 'approved' | 'rejected',
  adminNote?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: oldExpense } = await supabase.from('expenses').select('*').eq('id', expenseId).single()

  const { error } = await supabase
    .from('expenses')
    .update({
      status,
      admin_note: adminNote || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', expenseId)

  if (error) throw new Error(error.message)

  await logAction(
    user.id,
    `expense_${status}`,
    'expense',
    expenseId,
    { status: oldExpense?.status },
    { status, admin_note: adminNote }
  )

  // Get expense details for notification
  const { data: expense } = await supabase
    .from('expenses')
    .select('*, camp:camps(name), submitter:profiles!expenses_submitted_by_fkey(email, full_name)')
    .eq('id', expenseId)
    .single()

  if (expense) {
    await sendNotification({
      type: status === 'approved' ? 'expense_approved' : 'expense_rejected',
      data: {
        expense_id: expenseId,
        to_email: (expense.submitter as Record<string, unknown>)?.email,
        to_name: (expense.submitter as Record<string, unknown>)?.full_name,
        amount: expense.amount,
        description: expense.description,
        admin_note: adminNote,
        camp_name: (expense.camp as Record<string, unknown>)?.name,
      },
    })
  }

  revalidatePath('/admin')
  revalidatePath('/camp')
}

export async function bulkUpdateExpenseStatus(
  expenseIds: string[],
  status: 'approved' | 'rejected',
  adminNote?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Only update pending expenses
  const { data: pendingExpenses } = await supabase
    .from('expenses')
    .select('id')
    .in('id', expenseIds)
    .eq('status', 'pending')

  const pendingIds = pendingExpenses?.map((e) => e.id) ?? []

  if (pendingIds.length === 0) return { affected: 0 }

  const { error } = await supabase
    .from('expenses')
    .update({
      status,
      admin_note: adminNote || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .in('id', pendingIds)

  if (error) throw new Error(error.message)

  for (const id of pendingIds) {
    await logAction(user.id, `expense_${status}`, 'expense', id)
  }

  revalidatePath('/admin')
  revalidatePath('/camp')
  return { affected: pendingIds.length }
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: old } = await supabase.from('expenses').select('*').eq('id', expenseId).single()
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
  if (error) throw new Error(error.message)

  await logAction(user.id, 'expense_deleted', 'expense', expenseId, old as Record<string, unknown>)

  revalidatePath('/admin')
  revalidatePath('/camp')
}

export async function addExpenseComment(expenseId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('expense_comments')
    .insert({ expense_id: expenseId, author_id: user.id, content })

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/camp')
}

export async function getFilteredExpenses(filters: ExpenseFilters): Promise<{
  expenses: ExpenseWithRelations[]
  total: number
}> {
  const supabase = await createClient()

  const page = filters.page ?? 1
  const perPage = filters.perPage ?? 25
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('expenses')
    .select(
      '*, camp:camps(id, name), submitter:profiles!expenses_submitted_by_fkey(id, full_name, email), category:expense_categories(id, name, color), reviewer:profiles!expenses_reviewed_by_fkey(id, full_name)',
      { count: 'exact' }
    )

  if (filters.search) {
    query = query.or(`description.ilike.%${filters.search}%,camps.name.ilike.%${filters.search}%`)
  }

  if (filters.campIds && filters.campIds.length > 0) {
    query = query.in('camp_id', filters.campIds)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    query = query.in('category_id', filters.categoryIds)
  }

  if (filters.priceMin !== undefined) {
    query = query.gte('amount', filters.priceMin)
  }

  if (filters.priceMax !== undefined) {
    query = query.lte('amount', filters.priceMax)
  }

  if (filters.dateFrom) {
    query = query.gte('submitted_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('submitted_at', filters.dateTo)
  }

  if (filters.hasReceipt) {
    query = query.not('receipt_url', 'is', null)
  }

  if (filters.submittedBy) {
    query = query.eq('submitted_by', filters.submittedBy)
  }

  const sortBy = filters.sortBy ?? 'submitted_at'
  const sortDir = filters.sortDir ?? 'desc'
  query = query.order(sortBy, { ascending: sortDir === 'asc' })

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) throw new Error(error.message)

  return {
    expenses: (data ?? []) as unknown as ExpenseWithRelations[],
    total: count ?? 0,
  }
}

export async function getExpenseById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select(
      '*, camp:camps(id, name), submitter:profiles!expenses_submitted_by_fkey(id, full_name, email), category:expense_categories(id, name, color), reviewer:profiles!expenses_reviewed_by_fkey(id, full_name)'
    )
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as unknown as ExpenseWithRelations
}

export async function getExpenseComments(expenseId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expense_comments')
    .select('*, author:profiles(id, full_name, role)')
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}
