import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardAlertsStats } from "@/lib/types/quotationAnalytics";
import { FC } from "react";

interface DashboardAlertsProps {
  data: DashboardAlertsStats;
}

const DashboardAlerts: FC<DashboardAlertsProps> = ({ data }) => {
  const alerts = [
    `${data.expiringSoon} quotations require attention in the next 2 days`,
    `${data.followupsDueToday} follow-ups are due today`,
    `${data.staleDrafts} draft quotations are pending for more than 3 days`,
  ];
  return (
    // <Card>
    //   <CardHeader>
    //     <CardTitle>Alerts</CardTitle>
    //   </CardHeader>
    //   <CardContent className="space-y-3">
    //     {alerts.map((alert) => (
    //       <div
    //         key={alert}
    //         className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
    //         ⚠ {alert}
    //       </div>
    //     ))}
    //   </CardContent>
    // </Card>

    <div>
      {" "}
      <div className="bg-muted p-4  text-woodsmoke-200 h-full flex flex-col gap-8 justify-between ">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Alerts</div>
        </div>
        <div className="">
          {alerts.map((alert) => (
            <div
              key={alert}
              className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              ⚠ {alert}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardAlerts;
