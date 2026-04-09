'use client'

import { useMemo } from 'react'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444']

interface Particle {
  id: number
  x: number
  color: string
  rotation: number
  scale: number
  delay: number
}

function generateParticles(): Particle[] {
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    delay: Math.random() * 0.3,
  }))
}

export function Confetti({ trigger }: { trigger: boolean }) {
  const particles = useMemo(() => (trigger ? generateParticles() : []), [trigger])

  // Respect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!trigger || particles.length === 0 || prefersReducedMotion) return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2.5 h-2.5 rounded-sm pointer-events-none"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            animation: `confetti-fall 2s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { top: -5%; opacity: 1; }
          100% { top: 110%; opacity: 0; transform: rotate(720deg) scale(0.3); }
        }
      `}</style>
    </div>
  )
}
