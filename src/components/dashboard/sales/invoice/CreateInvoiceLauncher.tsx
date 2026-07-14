"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { SalesOrderCombobox } from "../../global/SalesOrderCombobox";

interface CreateInvoiceLauncherProps {
  initialOrderId?: string | null;
}

const CreateInvoiceLauncher: React.FC<CreateInvoiceLauncherProps> = ({
  initialOrderId = null,
}) => {
  const router = useRouter();
  const [orderId, setOrderId] = React.useState<string | null>(initialOrderId);
  const [loading, setLoading] = React.useState(false);

  async function handleContinue() {
    if (!orderId) {
      toast.error("Please select a sales order");
      return;
    }

    try {
      setLoading(true);
      router.push(`/dashboard/sales/invoices/new?orderId=${orderId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto  space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Invoice
        </h1>
        <p className="text-sm text-muted-foreground">
          Start from a sales order or create an offline invoice without order copy.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sales Order</label>
          <SalesOrderCombobox value={orderId} onChange={setOrderId} />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/sales/invoices/new?offline=1")}
            disabled={loading}>
            {loading ? "Opening..." : "Create Offline Invoice"}
          </Button>
          <Button onClick={handleContinue} disabled={!orderId || loading}>
            {loading ? "Opening..." : "Create Draft Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceLauncher;
