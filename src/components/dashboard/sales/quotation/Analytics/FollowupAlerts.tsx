import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FollowupStats } from "@/lib/types/quotationAnalytics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface FollowupAlertsProps {
  data: FollowupStats;
}

const FollowupAlerts: FC<FollowupAlertsProps> = ({ data }) => {
  const items = [
    { title: "Follow-ups Today", value: data.today },
    { title: "Follow-ups Tomorrow", value: data.tomorrow },
    { title: "Overdue Follow-ups", value: data.overdue },
  ];

  return (
    <div>
      {" "}
      <div className="bg-muted p-4  text-woodsmoke-200 h-full flex flex-col gap-8 justify-between ">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Follow Ups</div>
          <Link
            href={"/dashboard/orders"}
            className=" hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
            <ArrowUpRight />
          </Link>
        </div>
        <div className="">
          {items.map((item, index) => (
            <div key={index} className="">
              <div className="flex items-end justify-between">
                <h3>{item.title}</h3>
                <h3>{item.value}</h3>
              </div>
              <Separator className="m-2 w-full bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowupAlerts;
