import { FC } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RawMaterialOpeningStockCard from "@/components/dashboard/raw-material/RawMaterialOpeningStockCard";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatCurrency(value?: number | null) {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const Page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;

  const [rawMaterial, grnItems] = await Promise.all([
    prisma.rawMaterial.findUnique({
      where: { id },
      select: {
        id: true,
        companyItemName: true,
        supplierItemName: true,
        itemCode: true,
        hsnCode: true,
        unit: true,
        description: true,
        reorderLevel: true,
        openingStockQty: true,
        openingStockUnitCost: true,
        openingStockAt: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        preferredSupplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
        stockBalance: {
          select: {
            qtyOnHand: true,
          },
        },
      },
    }),
    prisma.goodsReceiptNoteItem.findMany({
      where: {
        rawMaterialId: id,
        grn: {
          status: "FINALIZED",
        },
      },
      select: {
        id: true,
        qty: true,
        unitCost: true,
        title: true,
        supplierItemName: true,
        grn: {
          select: {
            id: true,
            grnNo: true,
            grnFy: true,
            receivedAt: true,
            supplierNameSnapshot: true,
            supplierInvoiceNo: true,
          },
        },
      },
      take: 300,
    }),
  ]);

  if (!rawMaterial) {
    return <div className="text-sm text-muted-foreground">Raw material not found.</div>;
  }

  const receiptRows = [...grnItems]
    .map((item) => ({
      id: item.id,
      qty: item.qty,
      unitCost: Number(item.unitCost || 0),
      supplier: item.grn.supplierNameSnapshot || "Unknown Supplier",
      receivedAt: item.grn.receivedAt,
      supplierInvoiceNo: item.grn.supplierInvoiceNo,
      grnLabel: formatFinancialDocumentNumber(item.grn.grnFy, item.grn.grnNo),
    }))
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

  const supplierPriceMap = new Map<
    string,
    {
      supplier: string;
      latestPrice: number;
      latestDate: Date;
      latestGrn: string;
      minPrice: number;
      maxPrice: number;
      totalPrice: number;
      count: number;
    }
  >();

  for (const row of receiptRows) {
    const key = row.supplier.trim() || "Unknown Supplier";
    const existing = supplierPriceMap.get(key);

    if (!existing) {
      supplierPriceMap.set(key, {
        supplier: key,
        latestPrice: row.unitCost,
        latestDate: row.receivedAt,
        latestGrn: row.grnLabel,
        minPrice: row.unitCost,
        maxPrice: row.unitCost,
        totalPrice: row.unitCost,
        count: 1,
      });
      continue;
    }

    existing.minPrice = Math.min(existing.minPrice, row.unitCost);
    existing.maxPrice = Math.max(existing.maxPrice, row.unitCost);
    existing.totalPrice += row.unitCost;
    existing.count += 1;
  }

  const supplierComparisons = Array.from(supplierPriceMap.values())
    .map((item) => ({
      ...item,
      avgPrice: item.count > 0 ? item.totalPrice / item.count : 0,
    }))
    .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {rawMaterial.companyItemName}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge>{rawMaterial.status}</Badge>
            {rawMaterial.deletedAt ? <Badge variant="destructive">DELETED</Badge> : null}
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href={`/dashboard/raw-materials/${rawMaterial.id}/edit`}>Edit</Link>
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border bg-card p-5">
        <div className="text-sm">
          <span className="text-muted-foreground">Supplier Item Name:</span>{" "}
          {rawMaterial.supplierItemName || "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Item Code:</span> {rawMaterial.itemCode || "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">HSN Code:</span> {rawMaterial.hsnCode || "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Unit:</span> {rawMaterial.unit}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Preferred Supplier:</span>{" "}
          {rawMaterial.preferredSupplier?.companyName || "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Reorder Level:</span>{" "}
          {rawMaterial.reorderLevel ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Current On Hand:</span>{" "}
          {rawMaterial.stockBalance?.qtyOnHand ?? 0}
        </div>
        <div className="text-xs text-muted-foreground">
          Created: {new Date(rawMaterial.createdAt).toLocaleString()}
        </div>
      </div>

      <RawMaterialOpeningStockCard
        rawMaterialId={rawMaterial.id}
        itemName={rawMaterial.companyItemName}
        currentOnHand={rawMaterial.stockBalance?.qtyOnHand ?? 0}
        openingStockQty={rawMaterial.openingStockQty ?? 0}
        openingStockUnitCost={
          rawMaterial.openingStockUnitCost == null
            ? null
            : Number(rawMaterial.openingStockUnitCost)
        }
        openingStockAt={rawMaterial.openingStockAt}
      />

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">Supplier Price Comparison (GRN)</h2>
        {supplierComparisons.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No finalized GRN prices available for this raw material yet.
          </div>
        ) : (
          <div className="rounded-xl border p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Supplier</TableHead>
                  <TableHead className="text-white">Latest Price</TableHead>
                  <TableHead className="text-white">Average Price</TableHead>
                  <TableHead className="text-white">Min Price</TableHead>
                  <TableHead className="text-white">Max Price</TableHead>
                  <TableHead className="text-white">Last GRN</TableHead>
                  <TableHead className="text-white">Last Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierComparisons.map((row) => (
                  <TableRow key={row.supplier}>
                    <TableCell>{row.supplier}</TableCell>
                    <TableCell>{formatCurrency(row.latestPrice)}</TableCell>
                    <TableCell>{formatCurrency(row.avgPrice)}</TableCell>
                    <TableCell>{formatCurrency(row.minPrice)}</TableCell>
                    <TableCell>{formatCurrency(row.maxPrice)}</TableCell>
                    <TableCell>{row.latestGrn}</TableCell>
                    <TableCell>{formatDate(row.latestDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-lg font-semibold">GRN Price History</h2>
        {receiptRows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No GRN receipt history available for this raw material.
          </div>
        ) : (
          <div className="rounded-xl border p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">GRN</TableHead>
                  <TableHead className="text-white">Supplier</TableHead>
                  <TableHead className="text-white">Supplier Invoice</TableHead>
                  <TableHead className="text-white">Qty</TableHead>
                  <TableHead className="text-white">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.receivedAt)}</TableCell>
                    <TableCell>{row.grnLabel}</TableCell>
                    <TableCell>{row.supplier}</TableCell>
                    <TableCell>{row.supplierInvoiceNo || "-"}</TableCell>
                    <TableCell>{row.qty}</TableCell>
                    <TableCell>{formatCurrency(row.unitCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Button asChild variant="ghost">
        <Link href="/dashboard/raw-materials">Back to Raw Materials</Link>
      </Button>
    </div>
  );
};

export default Page;
