import * as XLSX from 'xlsx'
import type { ExpenseWithRelations, Reimbursement, CampBudgetSummary } from './types'
import { getStatusLabel, getPaymentMethodLabel } from './utils'

export function exportExpensesToExcel(
  expenses: ExpenseWithRelations[],
  filename: string = 'expenses'
) {
  const data = expenses.map((e) => ({
    'קמפ': e.camp?.name ?? '',
    'תיאור': e.description,
    'קטגוריה': e.category?.name ?? '',
    'סכום': e.amount,
    'סטטוס': getStatusLabel(e.status),
    'תאריך': new Date(e.submitted_at).toLocaleDateString('he-IL'),
    'הגיש': e.submitter?.full_name ?? '',
    'הערת מנהל': e.admin_note ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'הוצאות')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportFullReport(
  summaries: CampBudgetSummary[],
  expenses: ExpenseWithRelations[],
  reimbursements: Reimbursement[],
  filename: string = 'full-report'
) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Summary
  const summaryData = summaries.map((s) => ({
    'קמפ': s.camp.name,
    'תקציב': s.camp.total_budget,
    'אושר': s.total_approved,
    'סטטוס החזר': reimbursements.find((r) => r.camp_id === s.camp.id)
      ? getStatusLabel(reimbursements.find((r) => r.camp_id === s.camp.id)!.status)
      : '—',
    'תאריך תשלום': reimbursements.find((r) => r.camp_id === s.camp.id)?.paid_at
      ? new Date(reimbursements.find((r) => r.camp_id === s.camp.id)!.paid_at!).toLocaleDateString('he-IL')
      : '—',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'סיכום')

  // Sheet 2: All approved expenses
  const approvedData = expenses
    .filter((e) => e.status === 'approved')
    .map((e) => ({
      'קמפ': e.camp?.name ?? '',
      'תיאור': e.description,
      'קטגוריה': e.category?.name ?? '',
      'סכום': e.amount,
      'תאריך': new Date(e.submitted_at).toLocaleDateString('he-IL'),
      'הגיש': e.submitter?.full_name ?? '',
    }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(approvedData), 'הוצאות מאושרות')

  // Sheet 3: Reimbursements
  const reimbData = reimbursements.map((r) => ({
    'קמפ': r.camp?.name ?? '',
    'סכום': r.total_amount,
    'סטטוס': getStatusLabel(r.status),
    'אמצעי תשלום': getPaymentMethodLabel(r.payment_method),
    'אסמכתא': r.payment_reference ?? '',
    'תאריך תשלום': r.paid_at ? new Date(r.paid_at).toLocaleDateString('he-IL') : '',
    'הערות': r.notes ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reimbData), 'החזרים')

  XLSX.writeFile(wb, `${filename}.xlsx`)
}
