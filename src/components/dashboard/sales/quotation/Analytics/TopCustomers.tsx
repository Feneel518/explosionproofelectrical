import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { TopCustomerItem } from "@/lib/types/quotationAnalytics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface TopCustomersProps {
  data: TopCustomerItem[];
}

const TopCustomers: FC<TopCustomersProps> = ({ data }) => {
  return (
    <div>
      {" "}
      <div className="bg-muted p-4  text-woodsmoke-200 h-full flex flex-col gap-8 justify-between ">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Top Customers</div>
          <Link
            href={"/dashboard/orders"}
            className=" hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
            <ArrowUpRight />
          </Link>
        </div>
        <div className="">
          {data.map((card, index) => {
            return (
              <>
                <div
                  key={`${card.customerId ?? card.customerName}`}
                  className="flex cards-center justify-between">
                  <div>
                    <p className="">{card.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {card.quotations} quotations
                    </p>
                  </div>
                  <p className="">{formatCurrencyINR(card.totalValue)}</p>
                </div>
                <Separator className="m-2 w-full bg-white/20" />
              </>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopCustomers;
