import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintSalesOrderButton({ orderId }: { orderId: string }) {
  return (
    <Button variant="outline" asChild>
      <a href={`/sales-orders/${encodeURIComponent(orderId)}/view?print=1`} target="_blank" rel="noopener noreferrer">
        <Printer className="mr-2 h-4 w-4" />
        Print Sales Order
      </a>
    </Button>
  );
}
