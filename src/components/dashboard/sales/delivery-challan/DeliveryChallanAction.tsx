"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeliveryChallanItem, DeliveryChallanStatus } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import React, { FC } from "react";
import { closeDeliveryChallanAction } from "../../../../lib/actions/dashboard/sales/delivery-challan/closeDeliveryChallanAction";
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import CloseDeliveryChallanDialog from "./CloseDeliveryChallanDialog";
import { reopenDeliveryChallanAsDraftAction } from "@/lib/actions/dashboard/sales/delivery-challan/reopenDeliveryChallanAsDraftAction";

interface DeliveryChallanActionProps {
  id: string;
  deletedAt: Date | null;
  status: DeliveryChallanStatus;
  items: {
    id: string;
    qty: number;
    pendingQty: number;
    closedQty: number;
    title: string;
  }[];
}

const DeliveryChallanAction: FC<DeliveryChallanActionProps> = ({
  id,
  deletedAt,
  status,
  items,
}) => {
  const pending = false;
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {(status === "DRAFT" ||
          status === "CANCELLED" ||
          status === "ISSUED") &&
        !deletedAt ? (
          <DropdownMenuItem asChild>
            <div
              onClick={async () => {
                const res = await reopenDeliveryChallanAsDraftAction(id);
                if (!res.ok) {
                  toast.error(res.message);
                  return;
                }
                router.push(`/dashboard/sales/delivery-challans/${id}/edit`);
              }}>
              Edit
            </div>
          </DropdownMenuItem>
        ) : null}

        {!deletedAt ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/sales/delivery-challans/${id}`}>View</Link>
          </DropdownMenuItem>
        ) : null}

        {status === "ISSUED" ||
        (status === "PARTIALLY_CLOSED" && !deletedAt) ? (
          <DropdownMenuItem asChild>
            <CloseDeliveryChallanDialog
              challanId={id}
              status={status}
              items={items.map((item) => ({
                id: item.id,
                title: item.title,
                qty: Number(item.qty || 0),
                closedQty: Number(item.closedQty || 0),
                pendingQty: Number(item.pendingQty || 0),
              }))}
            />
          </DropdownMenuItem>
        ) : null}

        {!deletedAt && status !== "DRAFT" && status !== "CANCELLED" ? (
          <DropdownMenuItem asChild>
            <Link href={`/delivery-challans/${id}/view`}>
              View Customer Copy
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DeliveryChallanAction;
