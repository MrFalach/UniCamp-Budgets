import { createClient } from '@/lib/supabase/server'
import { getCampMembers } from '@/lib/actions/camps'
import { notFound } from 'next/navigation'
import { CampDetailClient } from './CampDetailClient'

export default async function CampDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: camp } = await supabase.from('camps').select('*').eq('id', id).single()
  if (!camp) notFound()

  const members = await getCampMembers(id)
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_active', true)
    .order('full_name')

  return (
    <CampDetailClient
      camp={camp}
      members={members}
      allUsers={allUsers ?? []}
    />
  )
}
