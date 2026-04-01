import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConversionFunnelStats } from "@/lib/types/quotationAnalytics";
import { FC } from "react";

interface ConversionFunnelProps {
  data: ConversionFunnelStats;
}

const ConversionFunnel: FC<ConversionFunnelProps> = ({ data }) => {
  const steps = [
    { label: "Draft Created", value: data.drafts },
    { label: "Sent", value: data.sent },
    { label: "Negotiation", value: data.negotiation },
    { label: "Accepted", value: data.accepted },
  ];

  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="p-4 bg-muted flex flex-col justify-between">
      <div className="uppercase text-xl">Monthly Quotation </div>

      <div className="flex flex-col gap-2 mt-8">
        {steps.map((step) => (
          <>
            <div key={step.label} className="space-y-2">
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
            <Separator className="bg-white/20"></Separator>
          </>
        ))}
      </div>
    </div>
  );
};

export default ConversionFunnel;
