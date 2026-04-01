"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import FormLayout from "../global/FormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import LoadingButton from "../global/LoadingButton";
import { SupplierCombobox } from "@/components/dashboard/global/SupplierCombobox";
import {
  RawMaterialSchema,
  RawMaterialSchemaRequest,
} from "@/lib/validators/dashboard/raw-materials/RawMaterialValidator";
import { createRawMaterialAction } from "@/lib/actions/dashboard/raw-materials/CreateRawMaterial";
import { updateRawMaterialAction } from "@/lib/actions/dashboard/raw-materials/UpdateRawMaterial";

export default function RawMaterialForm({
  mode,
  rawMaterialId,
  initial,
  onCreated,
}: {
  mode: "create" | "edit";
  rawMaterialId?: string;
  initial?: Partial<RawMaterialSchemaRequest>;
  onCreated?: (rawMaterial: {
    id: string;
    companyItemName: string;
    itemCode: string | null;
    unit: string;
  }) => void;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<RawMaterialSchemaRequest>({
    resolver: zodResolver(RawMaterialSchema) as any,
    defaultValues: {
      id: initial?.id ?? undefined,
      companyItemName: initial?.companyItemName ?? "",
      supplierItemName: initial?.supplierItemName ?? "",
      itemCode: initial?.itemCode ?? "",
      hsnCode: initial?.hsnCode ?? "",
      unit: initial?.unit ?? "Nos",
      description: initial?.description ?? "",
      reorderLevel: initial?.reorderLevel,
      preferredSupplierId: initial?.preferredSupplierId ?? "",
      status: initial?.status ?? "ACTIVE",
    },
  });

  const onSubmit = (values: RawMaterialSchemaRequest) => {
    setError(null);

    start(async () => {
      const res =
        mode === "create"
          ? await createRawMaterialAction(values)
          : await updateRawMaterialAction(values);

      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }

      // @ts-ignore
      onCreated?.(res.data);
      toast.success(res.message);
      router.push("/dashboard/raw-materials");
      router.refresh();
    });
  };

  return (
    <FormLayout
      title={mode === "create" ? "New Raw Material" : "Edit Raw Material"}
      description={
        mode === "create"
          ? "Create raw material master for purchases and inventory stock posting."
          : "Update raw material details."
      }
      footer={
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={pending}>
            Cancel
          </Button>

          <Button
            type="submit"
            form="raw-material-form"
            disabled={pending || !form.formState.isValid}>
            {pending ? (
              <LoadingButton />
            ) : mode === "create" ? (
              "Create Raw Material"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      }
      footerHint={<span>Use the supplier and company naming to avoid item mismatch.</span>}>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form
          id="raw-material-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="companyItemName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Our Company Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. FLP Pedestal Fan 24 Inch Single Phase"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    This is your internal naming standard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierItemName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Supplier Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. FG000425 24: FLP Pedestal fan"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Keep supplier naming for PO/GRN matching.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        mode === "create"
                          ? "Auto generated (RM-001, RM-002...)"
                          : "Auto generated item code"
                      }
                      readOnly
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {mode === "create"
                      ? "Code is assigned automatically when you create."
                      : "Item code is system-generated and cannot be edited."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hsnCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HSN Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 8414" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="Nos / Kg / Mtr / Set" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reorderLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Level</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      placeholder="e.g. 20"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional stock alert threshold.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredSupplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Supplier</FormLabel>
                  <FormControl>
                    <SupplierCombobox
                      value={field.value || null}
                      onChange={(supplierId) => field.onChange(supplierId || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional extra specification / purchase notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <button type="submit" className="hidden" />
        </form>
      </Form>
    </FormLayout>
  );
}
