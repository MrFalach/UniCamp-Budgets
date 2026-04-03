'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserInviteDialog } from '@/components/UserInviteDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { updateUser } from '@/lib/actions/users'
import { toast } from 'sonner'

interface UserWithCamps {
  id: string
  full_name: string | null
  email: string | null
  role: string
  is_active: boolean
  created_at: string
  camp_members?: Array<{
    camp_id: string
    camp?: { id: string; name: string } | null
  }>
}

interface Props {
  users: UserWithCamps[]
}

export function AdminUsersClient({ users }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<UserWithCamps | null>(null)
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: UserWithCamps; newRole: string } | null>(null)

  async function handleRoleChange() {
    if (!roleChangeTarget) return
    try {
      await updateUser(roleChangeTarget.user.id, { role: roleChangeTarget.newRole })
      toast.success('התפקיד עודכן')
      setRoleChangeTarget(null)
    } catch {
      toast.error('שגיאה בעדכון תפקיד')
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    try {
      await updateUser(deactivateTarget.id, { is_active: false })
      toast.success('המשתמש הושבת')
      setDeactivateTarget(null)
    } catch {
      toast.error('שגיאה בהשבתת משתמש')
    }
  }

  async function handleActivate(userId: string) {
    try {
      await updateUser(userId, { is_active: true })
      toast.success('המשתמש הופעל')
    } catch {
      toast.error('שגיאה')
    }
  }

  const activeCount = users.filter((u) => u.is_active).length
  const inactiveCount = users.filter((u) => !u.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">משתמשים</h2>
          <p className="text-sm text-muted-foreground mt-1">
            ניהול משתמשים, הרשאות והזמנות למערכת
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} size="default">
          הזמן משתמש
        </Button>
      </div>

      <div className="flex gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 font-medium">
          פעילים: {activeCount}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-500 font-medium">
          מושבתים: {inactiveCount}
        </span>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>שם</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>תפקיד</TableHead>
                <TableHead>קמפים</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <span className="text-3xl">👥</span>
                      <p className="text-sm font-medium">אין משתמשים במערכת</p>
                      <p className="text-xs">הזמן משתמשים כדי להתחיל</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || user.email || '—'}</TableCell>
                    <TableCell dir="ltr" className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        onChange={(e) => {
                          const newRole = e.target.value
                          if (newRole !== user.role) {
                            setRoleChangeTarget({ user, newRole })
                          }
                        }}
                        className="h-8 w-28 rounded-md border border-input bg-background px-2.5 text-sm shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                      >
                        <option value="admin">מנהל</option>
                        <option value="camp">קמפ</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.camp_members?.map((cm) => (
                          <Badge key={cm.camp_id} variant="outline" className="text-xs">
                            {cm.camp?.name ?? cm.camp_id}
                          </Badge>
                        ))}
                        {(!user.camp_members || user.camp_members.length === 0) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          פעיל
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                          מושבת
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeactivateTarget(user)}
                        >
                          השבת
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleActivate(user.id)}
                        >
                          הפעל
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="השבתת משתמש"
        description={`האם להשבית את "${deactivateTarget?.full_name ?? deactivateTarget?.email}"? המשתמש לא יוכל להתחבר.`}
        onConfirm={handleDeactivate}
        confirmLabel="השבת"
        variant="destructive"
      />

      <ConfirmDialog
        open={!!roleChangeTarget}
        onOpenChange={(open) => !open && setRoleChangeTarget(null)}
        title="שינוי תפקיד"
        description={`האם לשנות את התפקיד של "${roleChangeTarget?.user.full_name || roleChangeTarget?.user.email}" ל${roleChangeTarget?.newRole === 'admin' ? 'מנהל' : 'קמפ'}?`}
        onConfirm={handleRoleChange}
        confirmLabel="שנה"
      />
    </div>
  )
}
