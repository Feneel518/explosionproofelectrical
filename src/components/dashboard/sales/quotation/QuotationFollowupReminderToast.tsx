"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getQuotationFollowupRemindersAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationFollowupRemindersAction";

const REMINDER_TOAST_ID = "quotation-followup-reminder";
const FOLLOWUP_REMINDERS_CHANGED_EVENT = "quotation-followups-changed";

export default function QuotationFollowupReminderToast() {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      const res = await getQuotationFollowupRemindersAction().catch((error) => {
        console.error("getQuotationFollowupRemindersAction error:", error);
        return null;
      });
      if (!mounted || !res?.ok) return;

      toast.dismiss(REMINDER_TOAST_ID);

      if (res.counts.overdue > 0) {
        toast.error(`${res.counts.overdue} overdue quotation follow-up(s)`, {
          id: REMINDER_TOAST_ID,
          action: {
            label: "View",
            onClick: () => {
              router.push(
                "/dashboard/sales/quotations?followUp=OVERDUE&sort=nextFollowupAt&dir=asc&page=1",
              );
            },
          },
          duration: 12000,
        });
      } else if (res.counts.today > 0) {
        toast.warning(`${res.counts.today} quotation follow-up(s) due today`, {
          id: REMINDER_TOAST_ID,
          action: {
            label: "View",
            onClick: () => {
              router.push(
                "/dashboard/sales/quotations?followUp=TODAY&sort=nextFollowupAt&dir=asc&page=1",
              );
            },
          },
          duration: 12000,
        });
      } else if (res.counts.upcoming > 0) {
        toast.info(`${res.counts.upcoming} upcoming quotation follow-up(s)`, {
          id: REMINDER_TOAST_ID,
          action: {
            label: "View",
            onClick: () => {
              router.push(
                "/dashboard/sales/quotations?followUp=UPCOMING&sort=nextFollowupAt&dir=asc&page=1",
              );
            },
          },
          duration: 12000,
        });
      }
    }

    load();
    const intervalId = window.setInterval(load, 60_000);
    window.addEventListener("focus", load);
    window.addEventListener(FOLLOWUP_REMINDERS_CHANGED_EVENT, load);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", load);
      window.removeEventListener(FOLLOWUP_REMINDERS_CHANGED_EVENT, load);
    };
  }, [pathname, router]);

  return null;
}
