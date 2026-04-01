import { Separator } from "@/components/ui/separator";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { TopProductPoint } from "@/lib/types/OrderAnalyticsTypes";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface TopProductsProps {
  data: TopProductPoint[];
}

const TopProducts: FC<TopProductsProps> = ({ data }) => {
  return (
    <div className="bg-muted p-4 text-woodsmoke-200 h-full flex flex-col gap-8 justify-between">
      <div className="flex items-center justify-between">
        <div className="uppercase text-xl">Top Products</div>
        <Link
          href={"/dashboard/products"}
          className="hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
          <ArrowUpRight />
        </Link>
      </div>

      <div>
        {data.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No products found.
          </div>
        ) : (
          data.map((item, index) => (
            <div key={item.productId}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h3>{item.productName}</h3>
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity}
                  </p>
                </div>
                <h3 className="text-right">{formatCurrencyINR(item.value)}</h3>
              </div>
              {index !== data.length - 1 && (
                <Separator className="m-2 w-full bg-white/20" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopProducts;
