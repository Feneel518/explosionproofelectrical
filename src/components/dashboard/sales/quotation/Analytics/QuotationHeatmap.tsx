import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HeatmapPoint } from "@/lib/types/quotationAnalytics";
import { FC } from "react";

interface QuotationHeatmapProps {
  data: HeatmapPoint[];
}

const QuotationHeatmap: FC<QuotationHeatmapProps> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.quotations), 1);

  return (
    // <Card>
    //   <CardHeader>
    //     <CardTitle>Quotation Activity Heatmap</CardTitle>
    //   </CardHeader>
    //   <CardContent className="space-y-4">
    //     {data.map((item) => (
    //       <div key={item.day} className="space-y-1">
    //         <div className="flex items-center justify-between text-sm">
    //           <span>{item.day}</span>
    //           <span>{item.quotations}</span>
    //         </div>
    //         <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
    //           <div
    //             className="h-full rounded-full bg-primary"
    //             style={{ width: `${(item.quotations / max) * 100}%` }}
    //           />
    //         </div>
    //       </div>
    //     ))}
    //   </CardContent>
    // </Card>
    <div>
      {" "}
      <div className="bg-muted p-4  text-woodsmoke-200 h-full flex flex-col gap-8 justify-between ">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Quotation Activity Heatmap</div>
        </div>
        <div className="">
          {data.map((item) => (
            <div key={item.day} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{item.day}</span>
                <span>{item.quotations}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.quotations / max) * 100}%` }}
                />
              </div>
              <Separator className="bg-white/20 my-1"></Separator>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationHeatmap;
