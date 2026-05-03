'use client'

import dynamic from 'next/dynamic'

export const CreditLine = dynamic(
  () => import('./CreditLine').then((m) => m.CreditLine),
  { ssr: false, loading: () => null }
)
