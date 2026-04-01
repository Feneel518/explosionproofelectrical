import { FC } from "react";
import { OverdueReturnablePoint } from "@/lib/types/deliveryChallanAnalytics";

interface Props {
  data: OverdueReturnablePoint[];
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

const OverdueReturnables: FC<Props> = ({ data }) => {
  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-4">
      <div className="uppercase text-xl">Overdue Returnables</div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No overdue returnables.
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-white/10 p-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{item.challanCode}</div>
                <div className="text-sm text-muted-foreground">
                  {item.customerName}
                </div>
                <div className="text-xs text-muted-foreground">
                  Due: {fmtDate(item.expectedReturnDate)}
                </div>
              </div>

              <div className="text-right text-sm font-medium">
                {item.daysOverdue}d overdue
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OverdueReturnables;
