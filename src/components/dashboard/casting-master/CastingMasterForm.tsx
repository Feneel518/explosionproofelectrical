"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";
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
import {
  CastingMasterSchema,
  CastingMasterSchemaRequest,
} from "@/lib/validators/dashboard/casting-masters/CastingMasterValidator";
import { createCastingMasterAction } from "@/lib/actions/dashboard/casting-masters/CreateCastingMaster";
import { updateCastingMasterAction } from "@/lib/actions/dashboard/casting-masters/UpdateCastingMaster";

export default function CastingMasterForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Partial<CastingMasterSchemaRequest>;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CastingMasterSchemaRequest>({
    resolver: zodResolver(CastingMasterSchema) as any,
    defaultValues: {
      id: initial?.id ?? undefined,
      castingItemName: initial?.castingItemName ?? "",
      castingCode: initial?.castingCode ?? "",
      drawingNumber: initial?.drawingNumber ?? "",
      hsnCode: initial?.hsnCode ?? "",
      unit: initial?.unit ?? "Nos",
      standardWeightKg: initial?.standardWeightKg,
      reorderLevel: initial?.reorderLevel,
      description: initial?.description ?? "",
      status: initial?.status ?? "ACTIVE",
    },
  });

  const onSubmit = (values: CastingMasterSchemaRequest) => {
    setError(null);

    start(async () => {
      const res =
        mode === "create"
          ? await createCastingMasterAction(values)
          : await updateCastingMasterAction(values);

      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.push("/dashboard/casting-masters");
      router.refresh();
    });
  };

  return (
    <FormLayout
      title={mode === "create" ? "New Casting Master" : "Edit Casting Master"}
      description={
        mode === "create"
          ? "Create casting item master for inward receipts from workers and stock tracking."
          : "Update casting master details."
      }
      footer={
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="casting-master-form"
            disabled={pending || !form.formState.isValid}
          >
            {pending ? (
              <LoadingButton />
            ) : mode === "create" ? (
              "Create Casting Master"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      }
      footerHint={<span>Use consistent naming to track weight and yields correctly.</span>}
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form
          id="casting-master-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="castingItemName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Casting Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Push Button Body"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    This name is used in receipts, ledgers, and stock.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="castingCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Casting Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        mode === "create"
                          ? "Auto generated (CM-001, CM-002...)"
                          : "Auto generated casting code"
                      }
                      readOnly
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {mode === "create"
                      ? "Code is assigned automatically when you create."
                      : "Casting code is system-generated and cannot be edited."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="drawingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drawing Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. PB-CAST-001" {...field} />
                  </FormControl>
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
                    <Input placeholder="e.g. 7616" {...field} />
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
                    <Input placeholder="Nos / Kg / Set" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="standardWeightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Standard Weight (Kg / Pc)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.001"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      placeholder="e.g. 9.500"
                    />
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
                      placeholder="Optional manufacturing notes"
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
