'use client'

import { useMemo } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  duration: number
  delay: number
  shape: 'circle' | 'diamond' | 'ring'
}

export function ParticleBackground() {
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 12,
      opacity: 0.03 + Math.random() * 0.07,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -20,
      shape: (['circle', 'diamond', 'ring'] as const)[Math.floor(Math.random() * 3)],
    })),
    []
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `particle-drift ${p.duration}s ease-in-out ${p.delay}s infinite`,
            ...(p.shape === 'circle' ? {
              borderRadius: '50%',
              background: 'currentColor',
              color: 'oklch(0.488 0.200 264)',
            } : p.shape === 'diamond' ? {
              transform: 'rotate(45deg)',
              background: 'currentColor',
              color: 'oklch(0.65 0.18 155)',
            } : {
              borderRadius: '50%',
              border: '1.5px solid currentColor',
              color: 'oklch(0.488 0.200 264)',
            }),
          }}
        />
      ))}
      <style>{`
        @keyframes particle-drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -20px) rotate(90deg); }
          50% { transform: translate(-10px, -40px) rotate(180deg); }
          75% { transform: translate(-30px, -10px) rotate(270deg); }
        }
      `}</style>
    </div>
  )
}
