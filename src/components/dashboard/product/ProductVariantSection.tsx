"use client";

import { useState } from "react";

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
import { ToggleStatus } from "@/lib/actions/dashboard/products/ToggleStatus";
import { Variant } from "@/lib/types/FullVariant";
import { ResponsiveModal } from "../global/ResponsiveModal";
import ProductVariantForm from "./ProductVariantForm";

export default function VariantsSection({
  productId,
  productName,
  variants,
}: {
  productId: string;
  variants: Variant[];
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [duplicatingVariantId, setDuplicatingVariantId] = useState<
    string | null
  >(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold">Variants</div>
          <div className="text-sm text-muted-foreground">
            Add configurations / type numbers for this product.
          </div>
        </div>

        <ResponsiveModal
          onOpenChange={setOpen}
          open={open}
          trigger={<Button>Add Variant</Button>}>
          <ProductVariantForm
            productName={productName}
            mode="create"
            productId={productId}
            onOpenChange={setOpen}></ProductVariantForm>
        </ResponsiveModal>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[180px] text-white">Status</TableHead>
              <TableHead className="w-[180px] text-white">Images</TableHead>
              <TableHead className="w-[180px] text-white">Drawings</TableHead>
              <TableHead className="w-[180px] text-white">SKU</TableHead>
              <TableHead className="w-[200px] text-white">
                Type Number
              </TableHead>
              <TableHead className="w-[120px] text-white text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {variants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-sm text-muted-foreground">
                  No variants yet.
                </TableCell>
              </TableRow>
            ) : (
              variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.variant}</TableCell>
                  <TableCell className="font-medium">
                    <Badge
                      variant={v.status === "ACTIVE" ? "default" : "secondary"}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {v.image.length === 0 ? "-" : v.image.length}
                  </TableCell>
                  <TableCell>
                    {v.drawings.length === 0 ? "-" : v.drawings.length}
                  </TableCell>
                  <TableCell>
                    {v.sku ? <Badge variant="outline">{v.sku}</Badge> : "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {v.typeNumber ?? "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <ResponsiveModal
                      onOpenChange={(isOpen) =>
                        setEditingVariantId(isOpen ? v.id : null)
                      }
                      open={editingVariantId === v.id}
                      trigger={<Button size="sm">Edit</Button>}>
                      <ProductVariantForm
                        productName={productName}
                        mode="edit"
                        variant={v}
                        productId={productId}
                        onOpenChange={() =>
                          setEditingVariantId(null)
                        }></ProductVariantForm>
                    </ResponsiveModal>

                    <ResponsiveModal
                      onOpenChange={(isOpen) =>
                        setDuplicatingVariantId(isOpen ? v.id : null)
                      }
                      open={duplicatingVariantId === v.id}
                      trigger={
                        <Button size="sm" variant="outline">
                          Duplicate
                        </Button>
                      }>
                      <ProductVariantForm
                        productName={productName}
                        mode="create"
                        variant={v}
                        productId={productId}
                        onOpenChange={() =>
                          setDuplicatingVariantId(null)
                        }></ProductVariantForm>
                    </ResponsiveModal>

                    <Button
                      variant={
                        v.status === "ACTIVE" ? "destructive" : "secondary"
                      }
                      size="sm"
                      onClick={() => ToggleStatus(v.id)}>
                      {v.status === "ACTIVE" ? "Deactivate" : "Activate"}
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
