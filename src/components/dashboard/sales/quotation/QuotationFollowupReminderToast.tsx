"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getQuotationFollowupRemindersAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationFollowupRemindersAction";

export default function QuotationFollowupReminderToast() {
  React.useEffect(() => {
    let mounted = true;

    async function load() {
      const res = await getQuotationFollowupRemindersAction();
      if (!mounted || !res.ok) return;

      if (res.counts.overdue > 0) {
        toast.error(`${res.counts.overdue} overdue quotation follow-up(s)`, {
          action: {
            label: "View",
            onClick: () => {
              window.location.href =
                "/dashboard/sales/quotations?followup=overdue";
            },
          },
          duration: 8000,
        });
      } else if (res.counts.today > 0) {
        toast.warning(`${res.counts.today} quotation follow-up(s) due today`, {
          action: {
            label: "View",
            onClick: () => {
              window.location.href =
                "/dashboard/sales/quotations?followup=today";
            },
          },
          duration: 8000,
        });
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
