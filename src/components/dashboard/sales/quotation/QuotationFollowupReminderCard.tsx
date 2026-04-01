import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuotationFollowupRemindersAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationFollowupRemindersAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

function getName(q: any) {
  return (
    q.customer?.companyName || q.clientName || q.receivedFromName || "Unnamed"
  );
}

function fmtDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function QuotationFollowupReminderCard() {
  const res = await getQuotationFollowupRemindersAction();
  if (!res.ok) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up Reminders</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Overdue</div>
            <div className="text-2xl font-semibold text-red-600">
              {res.counts.overdue}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Due Today</div>
            <div className="text-2xl font-semibold text-amber-600">
              {res.counts.today}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Upcoming</div>
            <div className="text-2xl font-semibold">{res.counts.upcoming}</div>
          </div>
        </div>

        {res.overdue.length > 0 ? (
          <div className="space-y-2">
            <div className="font-medium">Overdue Follow-ups</div>
            {res.overdue.slice(0, 5).map((q) => (
              <Link
                key={q.id}
                href={`/dashboard/sales/quotations/${q.id}`}
                className="block rounded-lg border p-3 hover:bg-muted/50">
                <div className="font-medium">
                  {formatFinancialDocumentNumber(q.quoteFy, q.quoteNo)} - {getName(q)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Due: {fmtDate(q.nextFollowupAt)}
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
