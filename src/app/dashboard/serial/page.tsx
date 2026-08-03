import Link from "next/link";
import { Search } from "lucide-react";

import SerialGenerator from "@/components/dashboard/serial/SerialGenerator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

type SerialPageProps = {
  searchParams: Promise<{ search?: string | string[] }>;
};

export default async function SerialPage({ searchParams }: SerialPageProps) {
  const currentYear = new Date().getFullYear();
  const params = await searchParams;
  const searchValue = Array.isArray(params.search)
    ? (params.search[0] ?? "")
    : (params.search ?? "");
  const search = searchValue.trim();
  const [products, serials, availableCount, invoicedCount] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        serialPrefix: true,
        serialCounters: {
          where: { year: currentYear },
          select: { lastNumber: true },
          take: 1,
        },
      },
    }),
    prisma.productSerial.findMany({
      where: search
        ? {
            OR: [
              { serialNumber: { contains: search, mode: "insensitive" } },
              { product: { name: { contains: search, mode: "insensitive" } } },
              {
                invoiceItem: {
                  invoice: {
                    OR: [
                      {
                        clientNameSnapshot: {
                          contains: search,
                          mode: "insensitive",
                        },
                      },
                      {
                        customer: {
                          companyName: {
                            contains: search,
                            mode: "insensitive",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 250,
      select: {
        id: true,
        serialNumber: true,
        status: true,
        createdAt: true,
        product: { select: { name: true } },
        invoiceItem: {
          select: {
            invoice: {
              select: {
                id: true,
                invoiceNo: true,
                invoiceFy: true,
                clientNameSnapshot: true,
                customer: { select: { companyName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.productSerial.count({ where: { status: "AVAILABLE" } }),
    prisma.productSerial.count({ where: { status: "INVOICED" } }),
  ]);

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    serialPrefix: product.serialPrefix,
    lastNumber: product.serialCounters[0]?.lastNumber ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Serial numbers</h1>
        <p className="text-sm text-muted-foreground">Generate product serial ranges and track them through invoicing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Available</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{availableCount}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Invoiced</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{invoicedCount}</CardContent></Card>
      </div>

      <SerialGenerator products={productOptions} />

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Serial register</CardTitle>
          <form className="flex max-w-2xl gap-2" action="/dashboard/serial">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search serial, product, or customer"
                className="border-input bg-background h-9 w-full rounded-md border pl-9 pr-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>
            <Button type="submit">Search</Button>
            {search ? <Button asChild type="button" variant="outline"><Link href="/dashboard/serial">Clear</Link></Button> : null}
          </form>
          {search ? <p className="text-sm text-muted-foreground">Showing matches for “{search}”</p> : null}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-3 pr-4">Serial</th><th className="py-3 pr-4">Product</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Invoice</th><th className="py-3">Customer</th></tr></thead>
            <tbody>
              {serials.map((serial) => {
                const invoice = serial.invoiceItem?.invoice;
                return (
                  <tr key={serial.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-mono font-medium"><Link className="text-primary underline-offset-4 hover:underline" href={`/dashboard/serial/${serial.id}`}>{serial.serialNumber}</Link></td>
                    <td className="py-3 pr-4">{serial.product.name}</td>
                    <td className="py-3 pr-4"><Badge variant={serial.status === "AVAILABLE" ? "secondary" : serial.status === "VOID" ? "destructive" : "default"}>{serial.status}</Badge></td>
                    <td className="py-3 pr-4">{invoice ? <Button asChild variant="link" className="h-auto p-0"><Link href={`/dashboard/sales/invoices/${invoice.id}`}>{formatFinancialDocumentNumber(invoice.invoiceFy, invoice.invoiceNo)}</Link></Button> : "—"}</td>
                    <td className="py-3">{invoice?.customer?.companyName ?? invoice?.clientNameSnapshot ?? "—"}</td>
                  </tr>
                );
              })}
              {serials.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">{search ? "No matching serial numbers found." : "No serial numbers generated yet."}</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
