'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CreditLine } from '@/components/CreditLine'

const FLOATING_EMOJIS = ['🔥', '⭐', '🎪', '✨', '🌈', '🎵', '💫', '🦋', '🌸', '🎨', '🪩', '🎭']

function FloatingEmojis() {
  const [emojis, setEmojis] = useState<Array<{
    id: number; emoji: string; x: number; y: number;
    size: number; duration: number; delay: number; drift: number;
  }>>([])

  useEffect(() => {
    const items = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: FLOATING_EMOJIS[i % FLOATING_EMOJIS.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 14 + Math.random() * 18,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * -10,
      drift: -30 + Math.random() * 60,
    }))
    queueMicrotask(() => setEmojis(items))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {emojis.map((e) => (
        <div
          key={e.id}
          className="absolute"
          style={{
            left: `${e.x}%`,
            top: `${e.y}%`,
            fontSize: `${e.size}px`,
            opacity: 0.15,
            animation: `sp-float ${e.duration}s ease-in-out ${e.delay}s infinite`,
            '--drift': `${e.drift}px`,
          } as React.CSSProperties}
        >
          {e.emoji}
        </div>
      ))}
    </div>
  )
}

function TwinklingStars() {
  const [stars, setStars] = useState<Array<{
    id: number; left: number; top: number; opacity: number; duration: number; delay: number;
  }>>([])

  useEffect(() => {
    queueMicrotask(() => setStars(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: 0.1 + Math.random() * 0.4,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * -3,
    }))))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute w-[2px] h-[2px] rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            opacity: s.opacity,
            animation: `sp-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

interface InvitePageProps {
  params: Promise<{ nonce: string }>
}

export default function InvitePage({ params }: InvitePageProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invite, setInvite] = useState<{ camp_name: string | null; email: string } | null>(null)
  const [expired, setExpired] = useState(false)
  const [nonce, setNonce] = useState<string>('')

  useEffect(() => {
    params.then(async (p) => {
      setNonce(p.nonce)
      try {
        const { getInvite } = await import('@/lib/actions/invites')
        const data = await getInvite(p.nonce)
        if (data) {
          setInvite({ camp_name: data.camp_name, email: data.email })
        } else {
          setExpired(true)
        }
      } catch {
        setExpired(true)
      }
      setLoading(false)
    })
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a1e] via-[#1a1035] to-[#0d0b1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-violet-600/10 via-fuchsia-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-t from-blue-600/8 to-transparent rounded-full blur-3xl" />
      <FloatingEmojis />
      <TwinklingStars />

      <div className="relative z-10 w-full max-w-md p-4">
        {/* Logo + title */}
        <div className="text-center mb-6 animate-scale-in">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-2xl" />
            <img
              src="/unicamp-logo.jpeg"
              alt="UniCamp"
              className="relative w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-violet-500/30 ring-2 ring-white/10 animate-float"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            UniCamp 2026
          </h1>
          <p className="text-violet-200/50 mt-1 text-sm">
            מערכת ניהול תקציב 💸
          </p>
        </div>

        <div className="animate-scale-in">
          <div className="bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl p-6 sm:p-8">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8 text-violet-200/60">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                <p className="text-sm">טוען...</p>
              </div>
            ) : expired ? (
              <div className="text-center py-6 space-y-4">
                <div className="text-5xl mb-2">😵</div>
                <h2 className="text-lg font-bold text-white">הלינק פג תוקף או לא תקין</h2>
                <p className="text-sm text-violet-200/50">
                  בקש מהמנהל לשלוח לך לינק חדש, זה לא אתה זה אנחנו 🤷
                </p>
                <a
                  href="/login"
                  className="inline-block text-sm text-violet-300/60 hover:text-violet-200 transition-colors"
                >
                  עבור לדף התחברות →
                </a>
              </div>
            ) : (
              <div className="text-center space-y-5">
                <div className="space-y-2">
                  <div className="text-5xl mb-1" style={{ animation: 'sp-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>🎪</div>
                  <h2 className="text-xl font-bold text-white">
                    ברוך הבא{invite?.camp_name ? ` ל${invite.camp_name}` : ''}! 🔥
                  </h2>
                  <p className="text-sm text-violet-200/50">
                    הוזמנת למערכת ניהול התקציב של UniCamp
                  </p>
                  {invite?.email && (
                    <p className="text-xs text-violet-200/30" dir="ltr">
                      {invite.email}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true)
                    try {
                      const { consumeInvite } = await import('@/lib/actions/invites')
                      const actionLink = await consumeInvite(nonce)
                      if (actionLink) {
                        window.location.href = actionLink
                      } else {
                        setExpired(true)
                      }
                    } catch {
                      setExpired(true)
                    }
                  }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 text-[15px]"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      רגע, מכין הכל...
                    </span>
                  ) : 'יאללה, בוא נגדיר סיסמה! 🚀'}
                </Button>

                <p className="text-[11px] text-violet-200/25">
                  בלחיצה תועבר להגדרת סיסמה למערכת
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Credit footer */}
        <div className="flex justify-center mt-6">
          <CreditLine />
        </div>
      </div>

      <style>{`
        @keyframes sp-float {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-15px) translateX(calc(var(--drift) * 0.5)) rotate(5deg); }
          50% { transform: translateY(-25px) translateX(var(--drift)) rotate(-3deg); }
          75% { transform: translateY(-10px) translateX(calc(var(--drift) * 0.3)) rotate(4deg); }
        }
        @keyframes sp-twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.5); }
        }
        @keyframes sp-pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
