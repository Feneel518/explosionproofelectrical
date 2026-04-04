"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { reopenSalesOrderAsDraftAction } from "@/lib/actions/dashboard/sales/order/reopenSalesOrderAsDraftAction";
import { SalesOrderStatus } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import React, { FC } from "react";
import { toast } from "sonner";

interface OrderActionProps {
  id: string;
  deletedAt: Date | null;
  status: SalesOrderStatus;
}

const OrderAction: FC<OrderActionProps> = ({ id, deletedAt, status }) => {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/sales/orders/${id}`}>View</Link>
        </DropdownMenuItem>

        {(status === "DRAFT" || status === "CONFIRMED") && !deletedAt ? (
          <DropdownMenuItem
            onClick={async () => {
              if (status === "DRAFT") {
                router.push(`/dashboard/sales/orders/${id}/edit`);
                return;
              }

              const res = await reopenSalesOrderAsDraftAction(id);

              if (!res.ok) {
                toast.error(res.message);
                return;
              }

              toast.success("Order reopened");
              router.push(`/dashboard/sales/orders/${id}/edit`);
              router.refresh();
            }}>
            Edit
          </DropdownMenuItem>
        ) : null}

        {!deletedAt ? (
          <DropdownMenuItem asChild>
            <Link href={`/sales-orders/${id}/view`}>View Customer Copy</Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrderAction;
