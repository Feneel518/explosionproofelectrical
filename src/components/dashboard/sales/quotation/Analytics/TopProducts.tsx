import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TopProductItem } from "@/lib/types/quotationAnalytics";
import Link from "next/link";
import { FC } from "react";

interface TopProductsProps {
  data: TopProductItem[];
}

const TopProducts: FC<TopProductsProps> = ({ data }) => {
  return (
    <div>
      {" "}
      <div className="bg-muted p-4  text-woodsmoke-200 h-full flex flex-col gap-8 justify-between ">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Top Products</div>
        </div>
        <div className="">
          {data.map((item, index) => {
            return (
              <div key={`${item.productId ?? item.productName}`} className="">
                <div className="flex items-start justify-between">
                  <div className="">
                    <h3>{item.productName}</h3>
                    <h3 className="text-sm text-muted-foreground">
                      QTY: {item.totalQty}
                    </h3>
                  </div>
                  <p>{item.quotationCount} quotes</p>
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

export default TopProducts;
