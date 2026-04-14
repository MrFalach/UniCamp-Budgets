'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/Confetti'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { markWelcomeSeen } from '@/lib/actions/users'

interface WelcomeOverlayProps {
  campName: string
  totalBudget: number
  campType: 'camp' | 'supplier' | 'production'
}

const EXPENSE_RULES = [
  { icon: '✅', text: 'הוצאות שקשורות ישירות לבניית הקמפ ופעילותו' },
  { icon: '✅', text: 'ציוד, חומרים, קישוטים, תאורה, מזון לקמפ' },
  { icon: '✅', text: 'חשוב לצרף קבלה/חשבונית לכל הוצאה' },
  { icon: '⛔', text: 'הוצאות אישיות שלא קשורות לקמפ' },
  { icon: '⛔', text: 'אלכוהול, סיגריות, ודברים שאמא שלך לא תאשר' },
  { icon: '⛔', text: 'הוצאות ללא קבלה — בלי קבלה, בלי כסף' },
  { icon: '💡', text: 'לא בטוחים? שלחו ותקבלו תשובה. עדיף לשאול מלהפסיד' },
]

export function WelcomeOverlay({ campName, totalBudget, campType }: WelcomeOverlayProps) {
  const [step, setStep] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  const entityLabel = campType === 'supplier' ? 'ספק' : 'קמפ'

  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => setShowConfetti(true), 400)
      return () => clearTimeout(t)
    }
  }, [step])

  // Mark welcome as seen as soon as it's shown, so it won't reappear
  // on refresh / navigation away, even if the user doesn't click through.
  useEffect(() => {
    markWelcomeSeen().catch(() => {})
  }, [])

  function handleDone() {
    setExiting(true)
    setTimeout(() => setVisible(false), 400)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-400 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Confetti trigger={showConfetti} />

      <div
        className={`relative w-[92vw] max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden ${
          exiting ? 'animate-elastic-exit' : 'animate-elastic-enter'
        }`}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-primary w-6' : i < step ? 'bg-primary/40' : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="text-6xl animate-float">🏕️</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">!ברוכים הבאים ל-UniCamp</h2>
                <p className="text-lg text-muted-foreground">
                  שמחים שהצטרפת. מכאן מנהלים את הכסף —
                  <br />
                  <span className="font-medium text-foreground">בלי אקסלים, בלי ווטסאפים, בלי כאב ראש.</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground/80">
                {campType === 'supplier'
                  ? `אתה מנהל את הספק "${campName}". הנה מה שצריך לדעת.`
                  : `אתה מנהל את הקמפ "${campName}". הנה מה שצריך לדעת.`
                }
              </p>
              <Button size="lg" onClick={() => setStep(1)} className="mt-2 min-w-32">
                קדימה, תראו לי 💰
              </Button>
            </div>
          )}

          {/* Step 1: Budget reveal */}
          {step === 1 && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="text-5xl">🎉</div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">התקציב של ה{entityLabel} שלך</p>
                <div className="py-4">
                  <div className="text-5xl sm:text-6xl font-black font-mono text-primary tracking-tight">
                    <AnimatedCounter value={totalBudget} prefix="₪" duration={1800} />
                  </div>
                </div>
                <p className="text-muted-foreground">
                  זה הסכום שעומד לרשותכם. תשתמשו בחוכמה —
                  <br />
                  <span className="text-sm">כי ברגע שנגמר, נגמר. אין קסם במדבר (טוב, אולי קצת).</span>
                </p>
              </div>
              <Button size="lg" onClick={() => setStep(2)} className="mt-2 min-w-32">
                הבנתי, מה החוקים? 📋
              </Button>
            </div>
          )}

          {/* Step 2: Rules */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold">מה מגישים ומה לא</h3>
                <p className="text-sm text-muted-foreground">כדי שלא נצטרך לחזור אליכם, הנה הכללים:</p>
              </div>

              <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                {EXPENSE_RULES.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 text-sm stagger-child"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{rule.icon}</span>
                    <span>{rule.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                <span className="text-lg shrink-0 mt-0.5">🏦</span>
                <div className="space-y-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    חשוב מאוד: הזינו את פרטי חשבון הבנק של ה{entityLabel}
                  </p>
                  <p className="text-amber-800/90 dark:text-amber-300/90">
                    כנסו לדף <span className="font-semibold">״החזר״</span> ומלאו את פרטי חשבון הבנק — בלי זה לא נוכל להעביר לכם את הכסף בסוף העונה.
                  </p>
                </div>
              </div>

              <div className="text-center pt-1">
                <Button size="lg" onClick={handleDone} className="min-w-40">
                  הבנתי, בואו נתחיל! 🚀
                </Button>
                <p className="text-[11px] text-muted-foreground mt-2">
                  תמיד אפשר לחזור לחוקים מהדשבורד
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
