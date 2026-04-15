import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { getUserCamp } from '@/lib/actions/camps'
import { getCampReimbursement } from '@/lib/actions/reimbursements'
import { formatCurrency, formatDate, getPaymentMethodLabel } from '@/lib/utils'
import { CampBankForm } from './CampBankForm'

export default async function CampReimbursementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const camp = await getUserCamp(user.id)
  if (!camp) {
    return <div className="text-center py-20 text-muted-foreground">לא משויך לקמפ</div>
  }

  const reimbursement = await getCampReimbursement(camp.id)
  const shitimAdvance = Number(camp.shitim_advance ?? 0)
  const isVirtual = reimbursement ? String(reimbursement.id).startsWith('virtual-shitim-') : false
  const approvedPortion = reimbursement && !isVirtual ? Number(reimbursement.total_amount) - shitimAdvance : 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">החזר כספי</h2>

      {!reimbursement ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            אין החזר כספי עדיין. ההחזר ייווצר לאחר סגירת העונה.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{isVirtual ? 'מקדמה שיטים — ממתין להחזר' : `סיכום החזר — ${camp.name}`}</span>
              <StatusBadge status={reimbursement.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold font-mono text-center py-4">
              {formatCurrency(reimbursement.total_amount)}
            </div>

            {isVirtual && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-800 p-3 text-sm text-sky-900 dark:text-sky-200">
                <p className="font-medium mb-1">🛟 מקדמה ששולמה על ידי הקמפ</p>
                <p className="text-xs text-sky-800/80 dark:text-sky-300/80">
                  סכום זה נרשם כהוצאה מאושרת ויוחזר אליכם יחד עם שאר ההוצאות בסגירת העונה.
                </p>
              </div>
            )}

            {!isVirtual && shitimAdvance > 0 && (
              <div className="rounded-lg border p-3 text-sm space-y-1.5 bg-muted/30">
                <p className="text-xs text-muted-foreground font-medium">פירוט ההחזר</p>
                <div className="flex justify-between">
                  <span>הוצאות מאושרות</span>
                  <span className="font-mono">{formatCurrency(approvedPortion)}</span>
                </div>
                <div className="flex justify-between text-sky-700 dark:text-sky-300">
                  <span className="inline-flex items-center gap-1">🛟 מקדמה שיטים</span>
                  <span className="font-mono">{formatCurrency(shitimAdvance)}</span>
                </div>
              </div>
            )}

            {reimbursement.status === 'paid' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="font-medium text-green-800">התשלום בוצע!</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">אמצעי תשלום:</span>
                    <p>{getPaymentMethodLabel(reimbursement.payment_method)}</p>
                  </div>
                  {reimbursement.payment_reference && (
                    <div>
                      <span className="text-muted-foreground">אסמכתא:</span>
                      <p dir="ltr">{reimbursement.payment_reference}</p>
                    </div>
                  )}
                  {reimbursement.paid_at && (
                    <div>
                      <span className="text-muted-foreground">תאריך:</span>
                      <p>{formatDate(reimbursement.paid_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {reimbursement.status === 'pending' && !isVirtual && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                ממתין לתשלום. וודא שפרטי הבנק שלך מעודכנים.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bank details form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פרטי בנק לתשלום</CardTitle>
        </CardHeader>
        <CardContent>
          <CampBankForm camp={camp} />
        </CardContent>
      </Card>
    </div>
  )
}
