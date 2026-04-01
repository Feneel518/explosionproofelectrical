import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { RecentQuotationItem } from "@/lib/types/quotationAnalytics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface RecentQuotationsProps {
  data: RecentQuotationItem[];
}

const RecentQuotations: FC<RecentQuotationsProps> = ({ data }) => {
  return (
    <div>
      {" "}
      <div className="bg-muted p-4  text-woodsmoke-200 h-full flex flex-col gap-8 justify-between ">
        <div className="flex items-center justify-between">
          <div className="uppercase text-xl">Recent Quotations</div>
          <Link
            href={"/dashboard/orders"}
            className=" hover:bg-primary rounded-full p-1 transition-all duration-100 ease-in-out">
            <ArrowUpRight />
          </Link>
        </div>
        <div className="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Quote No</TableHead>
                <TableHead className="text-white">Customer</TableHead>
                <TableHead className="text-white">Value</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {formatFinancialDocumentNumber(item.quoteFy, item.quoteNo)}
                  </TableCell>
                  <TableCell>{item.customerName}</TableCell>
                  <TableCell>{formatCurrencyINR(item.value)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                    }).format(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default RecentQuotations;
