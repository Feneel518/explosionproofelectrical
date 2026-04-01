"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { reopenQuotationAsDraftAction } from "@/lib/actions/dashboard/sales/quotation/reopenQuotationAsDraftAction";
import { QuotationStatus } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { FC } from "react";
import { toast } from "sonner";

interface QuotationActionProps {
  id: string;
  deletedAt: Date | null;
  status: QuotationStatus;
}

const QuotationAction: FC<QuotationActionProps> = ({
  id,
  deletedAt,
  status,
}) => {
  const [pending, start] = React.useTransition();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <div
            onClick={async () => {
              const res = await reopenQuotationAsDraftAction(id);
              if (!res.ok) {
                toast.error(res.message);
                return;
              }
              router.push(`/dashboard/sales/quotations/${id}/edit`);
            }}>
            Edit
          </div>
        </DropdownMenuItem>
        {status === "DRAFT" || status === "CANCELLED" ? null : (
          <DropdownMenuItem>
            <Link href={`/dashboard/sales/quotations/${id}`}>View</Link>
          </DropdownMenuItem>
        )}
        {status === "DRAFT" || status === "CANCELLED" ? null : (
          <DropdownMenuItem>
            <Link href={`/quotations/${id}/view`}>View Customer Copy</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuotationAction;
