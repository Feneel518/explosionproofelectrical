import { Separator } from "@/components/ui/separator";
import { DashboardAlertsType } from "@/lib/types/OrderAnalyticsTypes";
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface DashboardAlertsProps {
  data: DashboardAlertsType;
}

const DashboardAlerts: FC<DashboardAlertsProps> = ({ data }) => {
  const cards = [
    {
      title: "Overdue Dispatch Orders",
      value: data.overdueDispatchCount,
      bad: data.overdueDispatchCount > 0,
    },
    {
      title: "Too Many Draft Orders",
      value: data.tooManyDrafts ? "Yes" : "No",
      bad: data.tooManyDrafts,
    },
    {
      title: "Too Many Open Orders",
      value: data.tooManyOpenOrders ? "Yes" : "No",
      bad: data.tooManyOpenOrders,
    },
    {
      title: "Low Completion Rate",
      value: data.lowCompletionRate ? "Yes" : "No",
      bad: data.lowCompletionRate,
    },
  ];

  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-8 justify-between">
      <div className="flex items-center justify-between">
        <div className="uppercase text-xl">Dashboard Alerts</div>
        <Link
          href={"/dashboard/orders"}
          className="hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
          <ArrowUpRight />
        </Link>
      </div>

      <div>
        {cards.map((card, index) => {
          return (
            <div key={index}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {card.bad ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  <h3>{card.title}</h3>
                </div>
                <h3 className="text-right">{card.value}</h3>
              </div>
              {index !== cards.length - 1 && (
                <Separator className="m-2 w-full bg-white/20" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardAlerts;
