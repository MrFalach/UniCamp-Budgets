'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '', className }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)
  const rafId = useRef(0)

  useEffect(() => {
    if (hasAnimated.current) {
      queueMicrotask(() => setDisplay(value))
      return
    }

    const el = ref.current
    if (!el) return

    let cancelled = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()

          function tick(now: number) {
            if (cancelled) return
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = easeOutExpo(progress)
            setDisplay(Math.round(eased * value))

            if (progress < 1) {
              rafId.current = requestAnimationFrame(tick)
            }
          }

          rafId.current = requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId.current)
      observer.disconnect()
    }
  }, [value, duration])

  const formatted = display.toLocaleString('he-IL')

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
