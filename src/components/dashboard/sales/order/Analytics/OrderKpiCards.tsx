import { Separator } from "@/components/ui/separator";
import { OrderAnalyticsKpis } from "@/lib/types/OrderAnalyticsTypes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface OrderKpiCardsProps {
  data: OrderAnalyticsKpis;
}

type MiniCard = {
  title: string;
  href: string;
  items: {
    title: string;
    value: string | number;
  }[];
};

const OrderKpiCards: FC<OrderKpiCardsProps> = ({ data }) => {
  const cards: MiniCard[] = [
    {
      title: "Orders",
      href: "/dashboard/orders",
      items: [
        { title: "Total Orders", value: data.totalOrders },
        { title: "Draft Orders", value: data.draftOrders },
        { title: "Confirmed Orders", value: data.confirmedOrders },
      ],
    },
    {
      title: "Production",
      href: "/dashboard/orders",
      items: [
        { title: "In Production", value: data.inProductionOrders },
        {
          title: "Partially Dispatched",
          value: data.partiallyDispatchedOrders,
        },
        { title: "Dispatched Orders", value: data.dispatchedOrders },
      ],
    },
    {
      title: "Billing",
      href: "/dashboard/orders",
      items: [
        {
          title: "Partially Invoiced",
          value: data.partiallyInvoicedOrders,
        },
        { title: "Invoiced Orders", value: data.invoicedOrders },
        { title: "Completed Orders", value: data.completedOrders },
      ],
    },
    {
      title: "Value",
      href: "/dashboard/orders",
      items: [
        { title: "Cancelled Orders", value: data.cancelledOrders },
        {
          title: "Total Order Value",
          value: formatCurrency(data.totalOrderValue),
        },
        {
          title: "Avg Order Value",
          value: formatCurrency(data.avgOrderValue),
        },
      ],
    },
  ];

  return (
    <div className="col-span-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2 h-full">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-muted text-woodsmoke-200 flex h-full flex-col justify-between gap-8 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xl uppercase">{card.title}</div>
            <Link
              href={card.href}
              className="rounded-full p-1 transition-all duration-100 ease-in-out hover:bg-primary">
              <ArrowUpRight />
            </Link>
          </div>

          <div>
            {card.items.map((item, index) => (
              <div key={item.title}>
                <div className="flex items-end justify-between gap-4">
                  <h3>{item.title}</h3>
                  <h3 className="text-right">{item.value}</h3>
                </div>

                {index !== card.items.length - 1 && (
                  <Separator className="m-2 w-full bg-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderKpiCards;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
