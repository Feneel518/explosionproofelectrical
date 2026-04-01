"use client";

import React, { FC } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesOrderItemRow from "./SalesOrderItemRow";
import {
  SalesOrderFormType,
  SalesOrderItemField,
} from "@/lib/types/SalesOrderTypes";

interface SalesOrderItemsTabProps {
  form: SalesOrderFormType;
  fields: SalesOrderItemField[];
  addItem: () => void;
  duplicateItem: (index: number) => void;
  moveItemUp: (index: number) => void;
  moveItemDown: (index: number) => void;
  removeItem: (index: number) => void;
  watchedItemsLength: number;
  subtotal: number;
}

const SalesOrderItemsTab: FC<SalesOrderItemsTabProps> = ({
  form,
  fields,
  addItem,
  duplicateItem,
  moveItemUp,
  moveItemDown,
  removeItem,
  watchedItemsLength,
  subtotal,
}) => {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Sales Order Items</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add products, specifications, quantities, pricing and media.
            </p>
          </div>

          <Button type="button" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {fields.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No items added yet. Click{" "}
              <span className="font-medium">Add Item</span>.
            </div>
          ) : (
            fields.map((field, index) => (
              <SalesOrderItemRow
                key={field.id}
                form={form}
                index={index}
                addnew={addItem}
                onRemove={() => removeItem(index)}
                onDuplicate={() => duplicateItem(index)}
                onMoveUp={() => moveItemUp(index)}
                onMoveDown={() => moveItemDown(index)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Total Items</div>
            <div className="text-2xl font-semibold">{watchedItemsLength}</div>
          </div>

          <div className="grid gap-1 text-right">
            <div className="text-sm text-muted-foreground">Subtotal</div>
            <div className="text-2xl font-bold">₹{subtotal.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SalesOrderItemsTab;
