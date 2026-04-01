import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KpiStats } from "@/lib/types/quotationAnalytics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface QuotationKpiCardsProps {
  data: KpiStats;
}

const QuotationKpiCards: FC<QuotationKpiCardsProps> = ({ data }) => {
  const cards = [
    { title: "Total Quotations", value: data.totalQuotations },
    { title: "Sent Quotations", value: data.sentQuotations },
    { title: "Accepted Quotations", value: data.acceptedQuotations },
    { title: "Rejected Quotations", value: data.rejectedQuotations },
    { title: "Conversion Rate", value: `${data.conversionRate}%` },
  ];
  return (
    <div>
      {" "}
      <div className="bg-muted p-4  text-woodsmoke-200 h-full flex flex-col gap-8 justify-between ">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Quotations</div>
          <Link
            href={"/dashboard/orders"}
            className=" hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
            <ArrowUpRight />
          </Link>
        </div>
        <div className="">
          {cards.map((card, index) => {
            return (
              <div key={index} className="">
                <div className="flex items-end justify-between">
                  <h3>{card.title}</h3>
                  <h3>{card.value}</h3>
                </div>
                <Separator className="m-2 w-full bg-white/20" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  
};

export default QuotationKpiCards;
