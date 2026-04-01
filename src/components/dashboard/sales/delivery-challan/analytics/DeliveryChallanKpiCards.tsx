import { Separator } from "@/components/ui/separator";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";
import { DeliveryChallanKpiStats } from "@/lib/types/deliveryChallanAnalytics";

interface DeliveryChallanKpiCardsProps {
  data: DeliveryChallanKpiStats;
}

const DeliveryChallanKpiCards: FC<DeliveryChallanKpiCardsProps> = ({
  data,
}) => {
  const cards = [
    { title: "Total Challans", value: data.totalChallans },
    { title: "Open Challans", value: data.openChallans },
    { title: "Pending Items", value: data.pendingItems },
    { title: "Overdue Returnables", value: data.overdueReturnables },
  ];

  return (
    <div>
      <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-8 justify-between">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Delivery Challans</div>
          <Link
            href={"/dashboard/sales/delivery-challans"}
            className="hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
            <ArrowUpRight />
          </Link>
        </div>

        <div>
          {cards.map((card, index) => (
            <div key={index}>
              <div className="flex items-end justify-between">
                <h3>{card.title}</h3>
                <h3>{card.value}</h3>
              </div>
              <Separator className="m-2 w-full bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryChallanKpiCards;
