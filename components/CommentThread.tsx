'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { addExpenseComment } from '@/lib/actions/expenses'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  created_at: string
  author?: {
    id: string
    full_name: string | null
    role?: string
  } | null
}

interface CommentThreadProps {
  expenseId: string
  comments: Comment[]
}

export function CommentThread({ expenseId, comments }: CommentThreadProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      await addExpenseComment(expenseId, content.trim())
      setContent('')
      toast.success('תגובה נוספה')
    } catch (err) {
      toast.error('שגיאה בהוספת תגובה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">תגובות ({comments.length})</h4>

      {comments.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {comment.author?.full_name ?? 'משתמש'}
                </span>
                {comment.author?.role === 'admin' && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">מנהל</Badge>
                )}
                <span>{formatDateTime(comment.created_at)}</span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="הוסף תגובה..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
        />
        <Button type="submit" size="sm" disabled={loading || !content.trim()}>
          {loading ? 'שולח...' : 'שלח'}
        </Button>
      </form>
    </div>
  )
}
