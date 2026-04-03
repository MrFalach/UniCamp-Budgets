import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyExact(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'approved': return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
    case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'ממתין'
    case 'approved': return 'אושר'
    case 'rejected': return 'נדחה'
    case 'paid': return 'שולם'
    default: return status
  }
}

export function getBudgetColor(percent: number, threshold: number = 80): string {
  if (percent >= 100) return 'red'
  if (percent >= threshold) return 'amber'
  return 'green'
}

export function getPaymentMethodLabel(method: string | null): string {
  switch (method) {
    case 'bank_transfer': return 'העברה בנקאית'
    case 'bit': return 'Bit'
    case 'cash': return 'מזומן'
    case 'other': return 'אחר'
    default: return '—'
  }
}
