'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
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
    setEmojis(items)
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

function PasswordMascot({ strength }: { strength: number }) {
  const faces = ['😴', '😟', '🙂', '😎']
  const labels = ['', 'חלשה...', 'לא רע!', 'עדיין חלש, אבל יאללה 🤷']

  return (
    <div className="flex flex-col items-center gap-1 transition-all duration-500">
      <span
        className="text-4xl transition-all duration-500"
        style={{
          transform: `scale(${0.8 + strength * 0.15})`,
          filter: strength === 3 ? 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.5))' : 'none',
        }}
      >
        {faces[strength]}
      </span>
      {/* Always rendered with reserved height to prevent layout shift */}
      <span
        className={`text-[11px] font-medium transition-colors duration-300 leading-none min-h-[11px] ${
          strength === 0 ? 'opacity-0' :
          strength === 1 ? 'text-red-300' :
          strength === 2 ? 'text-amber-300' :
          'text-emerald-300'
        }`}
      >
        {labels[strength] || '\u00A0'}
      </span>
    </div>
  )
}

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const confettiRef = useRef<HTMLDivElement>(null)

  const SILLY_EMOJIS = ['🐸', '💀', '👽', '🤡', '🦄', '👾', '🧠', '🫠', '🤖', '🎃', '👻', '🐔', '🦑', '🌚', '🍕']
  // Map each character to a random emoji (stable per render)
  const emojiMapRef = useRef<Map<string, string[]>>(new Map())
  function getEmojiPassword(text: string, key: string) {
    if (!emojiMapRef.current.has(key) || emojiMapRef.current.get(key)!.length !== text.length) {
      emojiMapRef.current.set(key, Array.from({ length: text.length }, () =>
        SILLY_EMOJIS[Math.floor(Math.random() * SILLY_EMOJIS.length)]
      ))
    }
    return emojiMapRef.current.get(key)!.join('')
  }

  const supabase = createClient()

  const passwordStrength = password.length === 0
    ? 0
    : password.length < 3
      ? 1
      : password.length < 6
        ? 2
        : 3

  const passwordsMatch = confirm.length > 0 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    if (password !== confirm) {
      toast.error('הסיסמאות לא תואמות')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error('שגיאה בהגדרת סיסמה', { description: error.message })
      setLoading(false)
      return
    }

    setSuccess(true)
    toast.success('הסיסמה הוגדרה בהצלחה!')
    setTimeout(() => {
      window.location.href = '/'
    }, 2500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Warm dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0a1e] via-[#1a1035] to-[#0d0b1a]" />

      {/* Soft aurora glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-violet-600/10 via-fuchsia-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-t from-blue-600/8 to-transparent rounded-full blur-3xl" />

      {/* Floating emojis */}
      <FloatingEmojis />

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.1 + Math.random() * 0.4,
              animation: `sp-twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * -3}s infinite`,
            }}
          />
        ))}
      </div>

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
            {success ? 'נתראה בפנים! 🎉' : 'ברוך הבא! בוא נגדיר לך סיסמה 🔐'}
          </p>
        </div>

        {/* Success state */}
        {success ? (
          <div className="animate-scale-in" ref={confettiRef}>
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl p-8 text-center">
              <div className="relative inline-block">
                <div className="text-6xl mb-3" style={{ animation: 'sp-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>🎊</div>
                {/* Mini celebration emojis bursting out */}
                {['🌟', '✨', '🎉', '💫', '⭐', '🔥'].map((emoji, i) => (
                  <span
                    key={i}
                    className="absolute text-lg"
                    style={{
                      top: '50%',
                      left: '50%',
                      animation: `sp-burst 1s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.08}s forwards`,
                      '--angle': `${i * 60}deg`,
                      '--distance': `${50 + Math.random() * 30}px`,
                      opacity: 0,
                    } as React.CSSProperties}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">מעולה!</h2>
              <p className="text-violet-200/50 text-sm mb-4">הסיסמה הוגדרה, מעביר אותך למערכת...</p>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-violet-400"
                    style={{ animation: `sp-bounce-dot 0.6s ease-in-out ${i * 0.15}s infinite alternate` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-scale-in">
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl p-6 sm:p-8">
              {/* Welcome badge */}
              <div className="flex justify-center mb-5">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-400/15 text-violet-200/80 text-xs font-medium">
                  <span className="text-sm">👋</span>
                  חשבון חדש
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-violet-100/70 text-sm font-medium">סיסמה חדשה</Label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        dir="ltr"
                        placeholder="לפחות 6 תווים"
                        className={`bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 focus:border-violet-400/40 focus:ring-violet-400/15 h-11 rounded-xl w-full ${
                          showPassword && password.length > 0 ? 'text-transparent caret-violet-400' : ''
                        }`}
                      />
                      {showPassword && password.length > 0 && (
                        <div
                          className="absolute inset-0 flex items-center px-2.5 text-sm tracking-widest pointer-events-none select-none overflow-hidden"
                          dir="ltr"
                          style={{ animation: 'sp-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                          {getEmojiPassword(password, 'pw')}
                        </div>
                      )}
                    </div>
                    {/* Always rendered to reserve space — fades in once user starts typing */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={password.length > 0 ? 0 : -1}
                      aria-hidden={password.length === 0}
                      className={`text-lg hover:scale-125 transition-all duration-200 shrink-0 w-8 h-8 flex items-center justify-center ${
                        password.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {/* Mascot + strength meter — always rendered, fades in on first keystroke */}
                  <div
                    className={`flex items-center gap-3 pt-1 transition-opacity duration-300 ${
                      password.length > 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden={password.length === 0}
                  >
                    <PasswordMascot strength={passwordStrength} />
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-1 h-1.5">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all duration-500 ${
                              passwordStrength >= level
                                ? level === 1 ? 'bg-red-400 shadow-sm shadow-red-400/30'
                                : level === 2 ? 'bg-amber-400 shadow-sm shadow-amber-400/30'
                                : 'bg-emerald-400 shadow-sm shadow-emerald-400/30'
                                : 'bg-white/[0.06]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-violet-100/70 text-sm font-medium">
                  {confirm.length > 0 ? (passwordsMatch ? 'קולולולולו 🎉' : 'את אף פעם לא תמצאי התאמה, אולי פה תצליחי') : 'אימות סיסמה'}
                </Label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Input
                        id="confirm"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        dir="ltr"
                        placeholder="הקלד שוב את הסיסמה"
                        className={`bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 focus:border-violet-400/40 focus:ring-violet-400/15 h-11 rounded-xl transition-all duration-300 w-full ${
                          confirm.length > 0
                            ? passwordsMatch
                              ? 'border-emerald-500/30'
                              : 'border-red-500/30'
                            : ''
                        } ${showConfirm && confirm.length > 0 ? 'text-transparent caret-violet-400' : ''}`}
                      />
                      {showConfirm && confirm.length > 0 && (
                        <div
                          className="absolute inset-0 flex items-center px-2.5 text-sm tracking-widest pointer-events-none select-none overflow-hidden"
                          dir="ltr"
                          style={{ animation: 'sp-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                          {getEmojiPassword(confirm, 'cf')}
                        </div>
                      )}
                    </div>
                    {/* Always rendered to reserve space; pops in once user types */}
                    <span
                      key={`${passwordsMatch}-${confirm.length > 0}`}
                      className={`text-base shrink-0 w-5 text-center transition-opacity duration-200 ${
                        confirm.length > 0 ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={confirm.length > 0 ? { animation: 'sp-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' } : undefined}
                      aria-hidden={confirm.length === 0}
                    >
                      {passwordsMatch ? '✅' : '❌'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={confirm.length > 0 ? 0 : -1}
                      aria-hidden={confirm.length === 0}
                      className={`text-lg hover:scale-125 transition-all duration-200 shrink-0 w-8 h-8 flex items-center justify-center ${
                        confirm.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    >
                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !passwordsMatch || password.length < 6}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 text-[15px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      שומר...
                    </span>
                  ) : 'יאללה, נתחיל! 🚀'}
                </Button>
              </form>
            </div>
          </div>
        )}

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
        @keyframes sp-burst {
          0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--distance) * -1)); opacity: 0; }
        }
        @keyframes sp-bounce-dot {
          0% { transform: translateY(0); opacity: 0.5; }
          100% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
