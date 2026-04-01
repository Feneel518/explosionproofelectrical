import { FC } from "react";
import { OpenChallanPoint } from "@/lib/types/deliveryChallanAnalytics";

interface Props {
  data: OpenChallanPoint[];
}

const OpenChallans: FC<Props> = ({ data }) => {
  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-4">
      <div className="uppercase text-xl">Open Challans</div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-sm text-muted-foreground">No open challans.</div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-white/10 p-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{item.challanCode}</div>
                <div className="text-sm text-muted-foreground">
                  {item.customerName} • {item.type}
                </div>
              </div>

              <div className="text-right text-sm">
                <div>{item.status}</div>
                <div className="text-muted-foreground">
                  {item.daysOpen}d open
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OpenChallans;
