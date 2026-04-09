'use client'

import { useEffect, useRef, useState } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number
  className?: string
  delay?: number
}

export function TypewriterText({ text, speed = 60, className = '', delay = 300 }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let i = 0
    let intervalId: ReturnType<typeof setInterval>
    let cursorTimeoutId: ReturnType<typeof setTimeout>

    const delayId = setTimeout(() => {
      intervalId = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(intervalId)
          cursorTimeoutId = setTimeout(() => setShowCursor(false), 1500)
        }
      }, speed)
    }, delay)

    cleanupRef.current = () => {
      clearTimeout(delayId)
      clearInterval(intervalId)
      clearTimeout(cursorTimeoutId)
    }

    return () => cleanupRef.current?.()
  }, [text, speed, delay])

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">
        {displayed}
        {showCursor && <span className="animate-pulse-soft">|</span>}
      </span>
    </span>
  )
}
