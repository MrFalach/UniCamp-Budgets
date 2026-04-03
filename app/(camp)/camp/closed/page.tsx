import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CampClosedPage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <Card>
        <CardContent className="py-12 space-y-4">
          <h2 className="text-2xl font-bold">העונה נסגרה</h2>
          <p className="text-muted-foreground">
            לא ניתן להגיש הוצאות חדשות. ניתן לצפות בהוצאות קיימות ובסטטוס ההחזר.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/camp/expenses">
              <Button variant="outline">צפה בהוצאות</Button>
            </Link>
            <Link href="/camp/reimbursement">
              <Button>סטטוס החזר</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
