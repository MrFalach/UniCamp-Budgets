export type UserRole = 'admin' | 'camp'
export type SeasonStatus = 'active' | 'closed'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'
export type ReceiptType = 'image' | 'pdf'
export type ReimbursementStatus = 'pending' | 'paid'
export type PaymentMethod = 'bank_transfer' | 'bit' | 'cash' | 'other'
export type CampType = 'camp' | 'supplier'

export interface AppSettings {
  id: number
  event_name: string
  event_year: number
  season_status: SeasonStatus
  budget_warning_threshold: number
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Camp {
  id: string
  name: string
  type: CampType
  total_budget: number
  description: string | null
  is_active: boolean
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  bank_branch: string | null
  created_at: string
}

export interface CampCategory {
  id: string
  camp_id: string
  category_id: string
  created_at: string
  category?: ExpenseCategory
}

export interface CampMember {
  id: string
  camp_id: string
  user_id: string
}

export interface ExpenseCategory {
  id: string
  name: string
  color: string | null
  budget_cap: number | null
  sort_order: number
}

export interface Expense {
  id: string
  camp_id: string
  submitted_by: string
  amount: number
  description: string
  category_id: string | null
  receipt_url: string | null
  receipt_type: ReceiptType | null
  status: ExpenseStatus
  admin_note: string | null
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  is_archived: boolean
}

export interface ExpenseWithRelations extends Expense {
  camp?: Camp
  submitter?: Profile
  category?: ExpenseCategory
  reviewer?: Profile
}

export interface ExpenseComment {
  id: string
  expense_id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface Reimbursement {
  id: string
  camp_id: string
  total_amount: number
  status: ReimbursementStatus
  payment_method: PaymentMethod | null
  payment_reference: string | null
  paid_at: string | null
  paid_by: string | null
  notes: string | null
  created_at: string
  camp?: Camp
}

export interface AuditLog {
  id: string
  actor_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
  actor?: Profile
}

export interface CampBudgetSummary {
  camp: Camp
  total_approved: number
  total_pending: number
  total_rejected: number
  remaining: number
  usage_percent: number
}

export interface Invite {
  nonce: string
  email: string
  camp_id: string | null
  created_at: string
  expires_at: string
  consumed_at: string | null
}

export interface ExpenseFilters {
  search?: string
  campIds?: string[]
  status?: ExpenseStatus | 'all'
  categoryIds?: string[]
  priceMin?: number
  priceMax?: number
  dateFrom?: string
  dateTo?: string
  hasReceipt?: boolean
  submittedBy?: string
  page?: number
  perPage?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}
