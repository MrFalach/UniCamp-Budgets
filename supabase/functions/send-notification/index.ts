// Supabase Edge Function: send-notification
// Sends email notifications via Resend API

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@midburn-budget.com'

interface NotificationRequest {
  type: string
  data: Record<string, unknown>
}

function emailLayout(content: string): string {
  return `
    <div dir="rtl" style="font-family: -apple-system, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a2e;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #4f46e5; border-radius: 12px; width: 48px; height: 48px; line-height: 48px; font-size: 24px;">🔥</div>
      </div>
      ${content}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        הודעה אוטומטית ממערכת UniCamp 2026
      </p>
    </div>
  `
}

Deno.serve(async (req: Request) => {
  try {
    const { type, data } = (await req.json()) as NotificationRequest

    let to: string[] = []
    let subject = ''
    let html = ''

    switch (type) {

      case 'camp_invite': {
        to = [data.to_email as string].filter(Boolean)
        subject = `הוזמנת לנהל את הקמפ "${data.camp_name}" — ${data.event_name}`
        html = emailLayout(`
          <h2 style="font-size: 22px; margin: 0 0 8px;">שלום! 👋</h2>
          <p style="font-size: 15px; line-height: 1.7; color: #374151;">
            הוזמנת לנהל את התקציב של קמפ <strong>"${data.camp_name}"</strong> באירוע <strong>${data.event_name}</strong>.
          </p>
          <p style="font-size: 15px; line-height: 1.7; color: #374151;">
            דרך המערכת תוכל/י להגיש הוצאות, לעקוב אחרי התקציב, ולקבל החזרים.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${data.invite_url}"
               style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
              כניסה למערכת והגדרת סיסמה
            </a>
          </div>
          <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
            לאחר הכניסה תוכל/י להגדיר סיסמה אישית ולהתחיל לעבוד עם המערכת.
            אם לא ביקשת הזמנה זו — ניתן להתעלם מהמייל.
          </p>
        `)
        break
      }

      case 'expense_submitted': {
        subject = `הוצאה חדשה הוגשה — ${data.camp_name}`
        html = emailLayout(`
          <h2 style="font-size: 20px; margin: 0 0 16px;">הוצאה חדשה הוגשה</h2>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280;">קמפ:</td><td style="padding: 8px 0; font-weight: 600;">${data.camp_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">סכום:</td><td style="padding: 8px 0; font-weight: 600;">₪${data.amount}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">תיאור:</td><td style="padding: 8px 0;">${data.description}</td></tr>
          </table>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${Deno.env.get('SITE_URL')}/admin/expenses"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
              צפה בהוצאה
            </a>
          </div>
        `)
        break
      }

      case 'expense_approved': {
        to = [data.to_email as string].filter(Boolean)
        subject = `ההוצאה שלך אושרה ✅ — ₪${data.amount}`
        html = emailLayout(`
          <h2 style="font-size: 20px; margin: 0 0 8px;">ההוצאה שלך אושרה! ✅</h2>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #065f46;">₪${data.amount}</p>
            <p style="margin: 4px 0 0; color: #047857;">${data.description}</p>
          </div>
          ${data.admin_note ? `<p style="font-size: 14px; color: #374151;"><strong>הערת מנהל:</strong> ${data.admin_note}</p>` : ''}
        `)
        break
      }

      case 'expense_rejected': {
        to = [data.to_email as string].filter(Boolean)
        subject = `ההוצאה שלך נדחתה — ₪${data.amount}`
        html = emailLayout(`
          <h2 style="font-size: 20px; margin: 0 0 8px;">ההוצאה שלך נדחתה</h2>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #991b1b;">₪${data.amount}</p>
            <p style="margin: 4px 0 0; color: #b91c1c;">${data.description}</p>
          </div>
          ${data.admin_note ? `<p style="font-size: 14px; color: #374151;"><strong>סיבת הדחייה:</strong> ${data.admin_note}</p>` : ''}
        `)
        break
      }

      case 'season_closed': {
        subject = 'העונה נסגרה — סיכום והחזרים'
        html = emailLayout(`
          <h2 style="font-size: 20px; margin: 0 0 8px;">העונה נסגרה 🏁</h2>
          <p style="font-size: 15px; line-height: 1.7; color: #374151;">
            העונה נסגרה. ניתן לצפות בכל ההוצאות ובסטטוס ההחזר שלכם במערכת.
          </p>
          <p style="font-size: 15px; line-height: 1.7; color: #374151;">
            לא ניתן להגיש הוצאות חדשות.
          </p>
        `)
        break
      }

      case 'reimbursement_paid': {
        const members = data.members as Array<{ user: { email: string } }>
        to = members?.map((m) => m.user?.email).filter(Boolean) ?? []
        subject = `ההחזר שולם — ${data.camp_name} — ₪${data.amount}`
        html = emailLayout(`
          <h2 style="font-size: 20px; margin: 0 0 8px;">ההחזר שולם! 💰</h2>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1e40af;">₪${data.amount}</p>
            <p style="margin: 4px 0 0; color: #1d4ed8;">קמפ: ${data.camp_name}</p>
          </div>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280;">אמצעי תשלום:</td><td style="padding: 6px 0;">${data.payment_method}</td></tr>
            ${data.payment_reference ? `<tr><td style="padding: 6px 0; color: #6b7280;">אסמכתא:</td><td style="padding: 6px 0;">${data.payment_reference}</td></tr>` : ''}
          </table>
        `)
        break
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown notification type' }), { status: 400 })
    }

    if (to.length === 0) {
      return new Response(JSON.stringify({ status: 'no_recipients' }), { status: 200 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), { status: res.ok ? 200 : 500 })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
