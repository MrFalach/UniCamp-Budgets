'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useRealtimeExpenses(onNewExpense?: () => void) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('expenses-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expenses',
        },
        () => {
          toast.info('הוצאה חדשה התקבלה!', {
            description: 'לחץ לרענון הרשימה',
            action: {
              label: 'רענן',
              onClick: () => onNewExpense?.(),
            },
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'expenses',
        },
        () => {
          onNewExpense?.()
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime subscription error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
