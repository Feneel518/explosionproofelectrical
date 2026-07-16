import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StockMovementToolbar from "@/components/dashboard/inventory/movement/StockMovementToolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  stockMovementSearchParamsCache,
  StockMovementQP,
} from "@/lib/searchParams/dashboard/inventory/movement/StockMovementSearchParams";
import { prisma } from "@/lib/prisma/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function buildMovementOrderBy(sp: StockMovementQP) {
  const dir = sp.dir === "asc" ? "asc" : "desc";

  switch (sp.sort) {
    case "movementType":
      return [{ movementType: dir }, { movementDate: "desc" }] as any;
    case "referenceType":
      return [{ referenceType: dir }, { movementDate: "desc" }] as any;
    case "actorName":
      return [{ actorName: dir }, { movementDate: "desc" }] as any;
    case "balanceAfter":
      return [{ balanceAfter: dir }, { movementDate: "desc" }] as any;
    case "movementDate":
    default:
      return [{ movementDate: dir }, { createdAt: dir }] as any;
  }
}

function buildPageHref(sp: StockMovementQP, page: number) {
  const params = new URLSearchParams();

  if (sp.q) params.set("q", sp.q);
  params.set("movementType", sp.movementType);
  params.set("referenceType", sp.referenceType);
  params.set("issueType", sp.issueType);
  params.set("sort", sp.sort);
  params.set("dir", sp.dir);
  if (sp.pageSize !== 20) params.set("pageSize", String(sp.pageSize));
  params.set("page", String(page));

  return `/dashboard/inventory/movements?${params.toString()}`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = stockMovementSearchParamsCache.parse(await searchParams);

  const q = sp.q.trim();
  const movementType = sp.movementType;
  const referenceType = sp.referenceType;
  const issueType = sp.issueType;
  const page = Math.max(1, sp.page);
  const pageSize = Math.min(100, Math.max(10, sp.pageSize));

  const where: any = {};
  if (movementType !== "ALL") where.movementType = movementType;
  if (referenceType !== "ALL") where.referenceType = referenceType;

  if (issueType !== "ALL") {
    if (referenceType !== "ALL" && referenceType !== "MATERIAL_ISSUE") {
      where.referenceId = "__none__";
    } else {
      const matchingIssues = await prisma.materialIssue.findMany({
        where: { issueType: issueType as any },
        select: { id: true },
      });

      where.referenceType = "MATERIAL_ISSUE";
      where.referenceId = {
        in: matchingIssues.length
          ? matchingIssues.map((issue) => issue.id)
          : ["__none__"],
      };
    }
  }

  if (q) {
    where.OR = [
      { referenceNo: { contains: q, mode: "insensitive" } },
      { actorName: { contains: q, mode: "insensitive" } },
      { remarks: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.stockLedger.findMany({
      where,
      orderBy: buildMovementOrderBy(sp),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        rawMaterial: {
          select: {
            id: true,
            companyItemName: true,
            supplierItemName: true,
            itemCode: true,
            hsnCode: true,
            unit: true,
          },
        },
        productVariant: {
          select: {
            variant: true,
            sku: true,
            typeNumber: true,
            product: {
              select: { name: true },
            },
          },
        },
        castingMaster: {
          select: {
            id: true,
            castingItemName: true,
            castingCode: true,
            drawingNumber: true,
            hsnCode: true,
            unit: true,
          },
        },
      },
    }),
    prisma.stockLedger.count({ where }),
  ]);

  const materialIssueIds = Array.from(
    new Set(
      items
        .filter((row) => row.referenceType === "MATERIAL_ISSUE")
        .map((row) => row.referenceId),
    ),
  );

  const issueMetaList =
    materialIssueIds.length > 0
      ? await prisma.materialIssue.findMany({
          where: {
            id: {
              in: materialIssueIds,
            },
          },
          select: {
            id: true,
            issueType: true,
            issuedToNameSnapshot: true,
            directSaleCustomerNameSnapshot: true,
            directSaleReferenceNo: true,
          },
        })
      : [];

  const issueMetaById = new Map(issueMetaList.map((row) => [row.id, row]));

  const stockAdjustmentIds = Array.from(
    new Set(
      items
        .filter((row) => row.referenceType === "MANUAL_ADJUSTMENT")
        .map((row) => row.referenceId),
    ),
  );

  const stockAdjustmentMetaList =
    stockAdjustmentIds.length > 0
      ? await prisma.stockAdjustment.findMany({
          where: {
            id: {
              in: stockAdjustmentIds,
            },
          },
          select: {
            id: true,
            reason: true,
            adjustedByNameSnapshot: true,
          },
        })
      : [];

  const stockAdjustmentMetaById = new Map(
    stockAdjustmentMetaList.map((row) => [row.id, row]),
  );

  const castingJobIds = Array.from(
    new Set(
      items
        .filter((row) => row.referenceType === "CASTING_JOB")
        .map((row) => row.referenceId),
    ),
  );

  const castingJobMetaList =
    castingJobIds.length > 0
      ? await prisma.castingJob.findMany({
          where: {
            id: {
              in: castingJobIds,
            },
          },
          select: {
            id: true,
            workerType: true,
            workerNameSnapshot: true,
            status: true,
          },
        })
      : [];

  const castingJobMetaById = new Map(
    castingJobMetaList.map((row) => [row.id, row]),
  );

  const invoiceIds = Array.from(
    new Set(
      items
        .filter((row) => row.referenceType === "INVOICE")
        .map((row) => row.referenceId),
    ),
  );

  const invoiceMetaList =
    invoiceIds.length > 0
      ? await prisma.invoice.findMany({
          where: {
            id: {
              in: invoiceIds,
            },
          },
          select: {
            id: true,
            invoiceNo: true,
            invoiceFy: true,
            clientNameSnapshot: true,
          },
        })
      : [];

  const invoiceMetaById = new Map(invoiceMetaList.map((row) => [row.id, row]));

  const deliveryChallanIds = Array.from(
    new Set(
      items
        .filter((row) => row.referenceType === "DELIVERY_CHALLAN")
        .map((row) => row.referenceId),
    ),
  );

  const deliveryChallanMetaList =
    deliveryChallanIds.length > 0
      ? await prisma.deliveryChallan.findMany({
          where: {
            id: {
              in: deliveryChallanIds,
            },
          },
          select: {
            id: true,
            customer: {
              select: {
                companyName: true,
              },
            },
          },
        })
      : [];

  const deliveryChallanMetaById = new Map(
    deliveryChallanMetaList.map((row) => [row.id, row]),
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock Movements</h1>
        <p className="text-sm text-muted-foreground">
          Full inward/outward history with reference document and person details.
        </p>
      </div>

      <StockMovementToolbar qp={sp} />

      <div className="rounded-xl border p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">Movement</TableHead>
              <TableHead className="text-white">Reference</TableHead>
              <TableHead className="text-white">Item</TableHead>
              <TableHead className="text-white">In</TableHead>
              <TableHead className="text-white">Out</TableHead>
              <TableHead className="text-white">Balance</TableHead>
              <TableHead className="text-white">Actor / Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No stock movements found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => {
                const isRawMaterial = Boolean(row.rawMaterial);
                const isCasting = Boolean(row.castingMaster);

                const itemTitle = isRawMaterial
                  ? row.rawMaterial?.companyItemName || "-"
                  : isCasting
                    ? row.castingMaster?.castingItemName || "-"
                    : [row.productVariant?.product.name, row.productVariant?.variant]
                        .filter(Boolean)
                        .join(" - ") || "-";

                const itemMeta = isRawMaterial
                  ? [row.rawMaterial?.itemCode, row.rawMaterial?.hsnCode, row.rawMaterial?.unit]
                      .filter(Boolean)
                      .join(" • ")
                  : isCasting
                    ? [
                        row.castingMaster?.castingCode,
                        row.castingMaster?.drawingNumber,
                        row.castingMaster?.hsnCode,
                        row.castingMaster?.unit,
                      ]
                        .filter(Boolean)
                        .join(" • ")
                    : [row.productVariant?.sku, row.productVariant?.typeNumber]
                        .filter(Boolean)
                        .join(" • ");

                return (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.movementDate)}</TableCell>
                    <TableCell>
                      <Badge variant={Number(row.qtyIn) > 0 ? "default" : "secondary"}>
                        {row.movementType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>{row.referenceType}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.referenceType === "GRN" ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/purchase/grn/${row.referenceId}`}>
                            {row.referenceNo || row.referenceId}
                          </Link>
                        ) : row.referenceType === "MATERIAL_ISSUE" ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/manufacturing/material-issues/${row.referenceId}`}>
                            {row.referenceNo || row.referenceId}
                          </Link>
                        ) : row.referenceType === "MATERIAL_RETURN" ? (
                          <Link
                            className="hover:underline"
                            href="/dashboard/inventory/returns">
                            {row.referenceNo || row.referenceId}
                          </Link>
                        ) : row.referenceType === "CASTING_JOB" ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/manufacturing/casting-jobs/${row.referenceId}`}>
                            {row.referenceNo || row.referenceId}
                          </Link>
                        ) : row.referenceType === "INVOICE" ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/sales/invoices/${row.referenceId}`}>
                            {row.referenceNo || row.referenceId}
                          </Link>
                        ) : row.referenceType === "DELIVERY_CHALLAN" ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/sales/delivery-challans/${row.referenceId}`}>
                            {row.referenceNo || row.referenceId}
                          </Link>
                        ) : row.referenceType === "MANUAL_ADJUSTMENT" &&
                          stockAdjustmentMetaById.has(row.referenceId) ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/inventory/adjustments/${row.referenceId}`}>
                            {row.referenceNo || row.referenceId}
                          </Link>
                        ) : (
                          row.referenceNo || row.referenceId
                        )}
                      </div>
                      {row.referenceType === "MATERIAL_ISSUE" ? (
                        <div className="text-xs text-muted-foreground">
                          {issueMetaById.get(row.referenceId)?.issueType === "DIRECT_SALE"
                            ? `Direct Sale • ${issueMetaById.get(row.referenceId)?.directSaleCustomerNameSnapshot || issueMetaById.get(row.referenceId)?.issuedToNameSnapshot || "-"}`
                            : `Internal Use • ${issueMetaById.get(row.referenceId)?.issuedToNameSnapshot || "-"}`}
                        </div>
                      ) : row.referenceType === "CASTING_JOB" &&
                        castingJobMetaById.has(row.referenceId) ? (
                        <div className="text-xs text-muted-foreground">
                          Casting Job •{" "}
                          {castingJobMetaById.get(row.referenceId)?.workerNameSnapshot || "-"}{" "}
                          ({castingJobMetaById.get(row.referenceId)?.workerType || "-"})
                        </div>
                      ) : row.referenceType === "MANUAL_ADJUSTMENT" &&
                        stockAdjustmentMetaById.has(row.referenceId) ? (
                        <div className="text-xs text-muted-foreground">
                          Manual Adjust •{" "}
                          {stockAdjustmentMetaById.get(row.referenceId)?.reason ||
                            stockAdjustmentMetaById.get(row.referenceId)
                              ?.adjustedByNameSnapshot ||
                            "-"}
                        </div>
                      ) : row.referenceType === "INVOICE" &&
                        invoiceMetaById.has(row.referenceId) ? (
                        <div className="text-xs text-muted-foreground">
                          Invoice • {invoiceMetaById.get(row.referenceId)?.clientNameSnapshot || "-"}
                        </div>
                      ) : row.referenceType === "DELIVERY_CHALLAN" &&
                        deliveryChallanMetaById.has(row.referenceId) ? (
                        <div className="text-xs text-muted-foreground">
                          Delivery Challan •{" "}
                          {deliveryChallanMetaById.get(row.referenceId)?.customer
                            ?.companyName || "-"}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div>
                        {isRawMaterial ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/raw-materials/${row.rawMaterial?.id}`}
                          >
                            {itemTitle}
                          </Link>
                        ) : isCasting ? (
                          <Link
                            className="hover:underline"
                            href={`/dashboard/casting-masters/${row.castingMaster?.id}`}
                          >
                            {itemTitle}
                          </Link>
                        ) : (
                          itemTitle
                        )}
                      </div>
                      {isRawMaterial && row.rawMaterial?.supplierItemName ? (
                        <div className="text-xs text-muted-foreground">
                          Supplier: {row.rawMaterial.supplierItemName}
                        </div>
                      ) : null}
                      {isCasting ? (
                        <div className="text-xs text-muted-foreground">
                          Casting Master
                        </div>
                      ) : null}
                      <div className="text-xs text-muted-foreground">{itemMeta || "-"}</div>
                    </TableCell>
                    <TableCell>{Number(row.qtyIn)}</TableCell>
                    <TableCell>{Number(row.qtyOut)}</TableCell>
                    <TableCell>{Number(row.balanceAfter)}</TableCell>
                    <TableCell>
                      <div>{row.actorName || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.remarks || "-"}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1} asChild>
            <Link href={buildPageHref(sp, page - 1)}>Prev</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" disabled={page >= totalPages} asChild>
            <Link href={buildPageHref(sp, page + 1)}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
