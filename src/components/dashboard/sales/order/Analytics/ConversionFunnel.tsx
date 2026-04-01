import { Separator } from "@/components/ui/separator";
import { OrderFunnelPoint } from "@/lib/types/OrderAnalyticsTypes";
import { FC } from "react";

interface ConversionFunnelProps {
  data: OrderFunnelPoint[];
}

const ConversionFunnel: FC<ConversionFunnelProps> = ({ data }) => {
  const steps = data.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="p-4 bg-muted flex flex-col justify-between h-full text-woodsmoke-200">
      <div className="uppercase text-xl">Order Funnel</div>

      <div className="flex flex-col gap-2 mt-8">
        {steps.map((step, index) => (
          <div key={step.label}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{step.label}</span>
                <span className="font-semibold">{step.value}</span>
              </div>

              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(step.value / max) * 100}%` }}
                />
              </div>
            </div>

            {index !== steps.length - 1 && (
              <Separator className="bg-white/20 mt-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversionFunnel;
