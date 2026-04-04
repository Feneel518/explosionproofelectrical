"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { reopenInvoiceAsDraftAction } from "@/lib/actions/dashboard/sales/invoice/reopenInvoiceAsDraftAction";
import { InvoiceStatus } from "@prisma/client";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { FC } from "react";
import { toast } from "sonner";

interface InvoiceActionProps {
  id: string;

  status: InvoiceStatus;
}

const InvoiceAction: FC<InvoiceActionProps> = ({ id, status }) => {
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
          <Link href={`/dashboard/sales/invoices/${id}`}>View</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${id}/view`}>Customer Copy</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${id}/packing-stickers`}>Packing Stickers</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${id}/test-certificate`}>Test Certificate</Link>
        </DropdownMenuItem>

        {status === "DRAFT" ? (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/sales/invoices/${id}/edit`}>Edit</Link>
          </DropdownMenuItem>
        ) : null}

        {status === "FINALIZED" ? (
          <DropdownMenuItem
            onClick={async () => {
              const res = await reopenInvoiceAsDraftAction(id);
              if (!res.ok) {
                toast.error(res.message);
                return;
              }
              toast.success(res.message);
              router.push(`/dashboard/sales/invoices/${id}/edit`);
              router.refresh();
            }}>
            Reopen as Draft
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InvoiceAction;
