'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Versioned key: bumping 'theme-v2' resets all existing preferences once,
    // so everyone starts in dark on next visit. Stay in sync with the
    // pre-hydration script in app/layout.tsx.
    const stored = localStorage.getItem('theme-v2')
    // Default to dark mode when no preference is stored
    const isDark = stored ? stored === 'dark' : true
    document.documentElement.classList.toggle('dark', isDark)
    // Schedule state update for next microtask to avoid lint warning
    queueMicrotask(() => {
      setDark(isDark)
      setMounted(true)
    })
  }, [])

  const toggle = useCallback(() => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme-v2', next ? 'dark' : 'light')
  }, [dark])

  if (!mounted) return <div className="w-8 h-8" />

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      className="text-muted-foreground hover:text-foreground"
      title={dark ? 'מצב בהיר' : 'מצב כהה'}
      aria-label={dark ? 'מצב בהיר' : 'מצב כהה'}
    >
      {dark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </Button>
  )
}
