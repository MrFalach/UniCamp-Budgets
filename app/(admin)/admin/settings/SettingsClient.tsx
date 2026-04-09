'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  updateAppSettings,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/actions/settings'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { AppSettings, ExpenseCategory, AuditLog } from '@/lib/types'

interface Props {
  settings: AppSettings
  categories: ExpenseCategory[]
  auditLogs: AuditLog[]
  auditTotal: number
}

export function SettingsClient({ settings, categories, auditLogs, auditTotal }: Props) {
  const [saving, setSaving] = useState(false)
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editCat, setEditCat] = useState<ExpenseCategory | null>(null)
  const [threshold, setThreshold] = useState(settings.budget_warning_threshold)

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateAppSettings(new FormData(e.currentTarget))
      toast.success('ההגדרות עודכנו')
    } catch {
      toast.error('שגיאה בשמירת ההגדרות')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      if (editCat) {
        await updateCategory(editCat.id, formData)
      } else {
        await createCategory(formData)
      }
      toast.success(editCat ? 'הקטגוריה עודכנה' : 'הקטגוריה נוצרה')
      setCatDialogOpen(false)
      setEditCat(null)
    } catch {
      toast.error('שגיאה')
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteCategory(id)
      toast.success('הקטגוריה נמחקה')
    } catch {
      toast.error('שגיאה במחיקת הקטגוריה')
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <h2 className="text-2xl font-bold">הגדרות</h2>

      {/* Event settings */}
      <Card>
        <CardHeader>
          <CardTitle>הגדרות אירוע</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_name">שם האירוע</Label>
                <Input id="event_name" name="event_name" defaultValue={settings.event_name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_year">שנה</Label>
                <Input id="event_year" name="event_year" type="number" defaultValue={String(settings.event_year)} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_warning_threshold">סף אזהרת תקציב (%)</Label>
              <div className="flex items-center gap-3">
                <input
                  id="budget_warning_threshold"
                  name="budget_warning_threshold"
                  type="range"
                  min={50}
                  max={95}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-sm font-mono w-10">{threshold}%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">סטטוס עונה:</span>
              <Badge variant={settings.season_status === 'active' ? 'default' : 'secondary'}>
                {settings.season_status === 'active' ? 'פעילה' : 'סגורה'}
              </Badge>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'שומר...' : 'שמור הגדרות'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Expense categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>קטגוריות הוצאות</CardTitle>
          <Button size="sm" onClick={() => { setEditCat(null); setCatDialogOpen(true) }}>
            הוסף קטגוריה
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>צבע</TableHead>
                <TableHead>תקרת תקציב</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    {cat.color && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                        <span dir="ltr" className="text-xs text-muted-foreground">{cat.color}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {cat.budget_cap ? `₪${cat.budget_cap.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditCat(cat); setCatDialogOpen(true) }}
                      >
                        ערוך
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        מחק
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle>יומן פעולות ({auditTotal})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>משתמש</TableHead>
                <TableHead>פעולה</TableHead>
                <TableHead>ישות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {(log.actor as unknown as Record<string, unknown>)?.full_name as string ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.entity_type ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCat ? 'ערוך קטגוריה' : 'קטגוריה חדשה'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4" key={editCat?.id ?? 'new'}>
            <div className="space-y-2">
              <Label htmlFor="cat-name">שם</Label>
              <Input id="cat-name" name="name" required defaultValue={editCat?.name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-color">צבע</Label>
              <input id="cat-color" name="color" type="color" defaultValue={editCat?.color ?? '#3B82F6'} className="h-10 w-16 rounded border cursor-pointer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-cap">תקרת תקציב (₪)</Label>
              <Input
                id="cat-cap"
                name="budget_cap"
                type="number"
                min={0}
                defaultValue={editCat?.budget_cap != null ? String(editCat.budget_cap) : ''}
                dir="ltr"
                placeholder="ללא הגבלה"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setCatDialogOpen(false)}>ביטול</Button>
              <Button type="submit">{editCat ? 'עדכן' : 'צור'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
