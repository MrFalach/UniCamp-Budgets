'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

interface ReceiptUploadProps {
  onFileSelect: (file: File | null) => void
  existingUrl?: string
  existingType?: 'image' | 'pdf'
  disabled?: boolean
}

export function ReceiptUpload({ onFileSelect, existingUrl, existingType, disabled }: ReceiptUploadProps) {
  const [preview, setPreview] = useState<{ name: string; size: string; type: 'image' | 'pdf'; url?: string } | null>(
    existingUrl ? { name: 'קבלה קיימת', size: '', type: existingType ?? 'image', url: existingUrl } : null
  )
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error('סוג קובץ לא נתמך', { description: 'יש להעלות תמונה (JPG, PNG, WebP, HEIC) או PDF' })
        return
      }
      if (file.size > MAX_SIZE) {
        toast.error('קובץ גדול מדי', { description: 'גודל מקסימלי: 10MB' })
        return
      }

      const isImage = file.type.startsWith('image/')
      const sizeStr = file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(0)}KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)}MB`

      setPreview({
        name: file.name,
        size: sizeStr,
        type: isImage ? 'image' : 'pdf',
        url: isImage ? URL.createObjectURL(file) : undefined,
      })
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile, disabled]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleRemove = () => {
    setPreview(null)
    onFileSelect(null)
  }

  if (preview) {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        {preview.type === 'image' && preview.url && (
          <img src={preview.url} alt="Receipt preview" className="max-h-48 rounded object-contain mx-auto" />
        )}
        {preview.type === 'pdf' && (
          <div className="flex items-center justify-center h-24 bg-muted rounded">
            <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
            </svg>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="truncate">{preview.name} {preview.size && `(${preview.size})`}</span>
          {!disabled && (
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              החלף
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => {
        if (!disabled) document.getElementById('receipt-input')?.click()
      }}
    >
      <input
        id="receipt-input"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <div className="space-y-2">
        <svg className="w-10 h-10 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-muted-foreground">
          גרור קובץ לכאן או לחץ לבחירת קובץ
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP, HEIC, PDF — עד 10MB
        </p>
      </div>
    </div>
  )
}
