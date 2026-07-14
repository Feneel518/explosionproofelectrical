"use client";

import Link from "next/link";
import React from "react";
import { Plus } from "lucide-react";

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

type BomListItem = {
  id: string;
  isActive: boolean;
  notes: string | null;
  updatedAt: Date;
  variant: {
    id: string;
    variant: string;
    sku: string | null;
    typeNumber: string | null;
    product: {
      id: string;
      name: string;
    };
  };
  _count: {
    items: number;
  };
};

export default function BomTable({ items }: { items: BomListItem[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild>
          <Link href="/dashboard/manufacturing/bom/new">
            <Plus className="mr-2 h-4 w-4" />
            New BOM
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Product</TableHead>
              <TableHead className="text-white">Variant</TableHead>
              <TableHead className="text-white">SKU / Type</TableHead>
              <TableHead className="text-white">Lines</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Notes</TableHead>
              <TableHead className="text-white">Updated</TableHead>
              <TableHead className="w-[120px] text-right text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No BOM created yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.variant.product.name}</TableCell>
                  <TableCell>{item.variant.variant}</TableCell>
                  <TableCell>
                    {[item.variant.sku, item.variant.typeNumber].filter(Boolean).join(" • ") ||
                      "-"}
                  </TableCell>
                  <TableCell>{item._count.items}</TableCell>
                  <TableCell>
                    {item.isActive ? <Badge>ACTIVE</Badge> : <Badge variant="secondary">INACTIVE</Badge>}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate">{item.notes || "-"}</TableCell>
                  <TableCell>{new Date(item.updatedAt).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/manufacturing/bom/${item.id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
