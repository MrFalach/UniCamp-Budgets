'use server'

import { createClient } from '@/lib/supabase/server'

export async function logAction(
  actorId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>
) {
  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
  })
}
