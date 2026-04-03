'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addCampMember, removeCampMember } from '@/lib/actions/camps'
import { toast } from 'sonner'
import type { Camp } from '@/lib/types'

interface Member {
  id: string
  camp_id: string
  user_id: string
  user?: { id: string; full_name: string | null; email: string | null; role?: string } | null
}

interface Props {
  camp: Camp
  members: Member[]
  allUsers: { id: string; full_name: string | null; email: string | null }[]
}

export function CampDetailClient({ camp, members, allUsers }: Props) {
  const [selectedUser, setSelectedUser] = useState('')

  const memberUserIds = new Set(members.map((m) => m.user_id))
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id))

  async function handleAdd() {
    if (!selectedUser) return
    try {
      await addCampMember(camp.id, selectedUser)
      toast.success('משתמש נוסף לקמפ')
      setSelectedUser('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה')
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeCampMember(camp.id, userId)
      toast.success('משתמש הוסר מהקמפ')
    } catch {
      toast.error('שגיאה בהסרת משתמש')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">{camp.name} — חברי קמפ</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">הוסף חבר</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedUser} onValueChange={(v) => setSelectedUser(v ?? '')}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="בחר משתמש" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name ?? u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!selectedUser}>הוסף</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">חברים ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm">אין חברים בקמפ</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{member.user?.full_name || member.user?.email || 'ללא שם'}</p>
                    <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemove(member.user_id)}>
                    הסר
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
