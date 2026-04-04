"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormLayout from "../global/FormLayout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  SupplierSchema,
  SupplierSchemaRequest,
} from "@/lib/validators/dashboard/suppliers/SupplierValidator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createSupplierAction } from "@/lib/actions/dashboard/suppliers/CreateSupplier";
import { updateSupplierAction } from "@/lib/actions/dashboard/suppliers/UpdateSupplier";
import { Spinner } from "@/components/ui/spinner";
import LoadingButton from "../global/LoadingButton";

export default function SupplierForm({
  mode,
  supplierId,
  initial,
  onCreated,
}: {
  mode: "create" | "edit";
  supplierId?: string;
  initial?: Partial<SupplierSchemaRequest>;
  onCreated?: (supplier: {
    id: string;
    companyName: string;
    city: string;
    state: string;
    gstin: string;
    companyEmail: string;
    companyPhone: string;
  }) => void;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [status, setStatus] = React.useState<SupplierSchemaRequest["status"]>(
    (initial?.status as any) ?? "ACTIVE",
  );
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<SupplierSchemaRequest>({
    resolver: zodResolver(SupplierSchema) as any,
    defaultValues: {
      id: initial?.id ?? undefined,
      companyName: initial?.companyName ?? "",
      companyEmail: initial?.companyEmail ?? "",
      companyPhone: initial?.companyPhone ?? "",
      addressLine1: initial?.addressLine1 ?? "",
      addressLine2: initial?.addressLine2 ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "",
      country: initial?.country ?? "",
      pincode: initial?.pincode ?? "",
      gstin: initial?.gstin ?? "",
      status: initial?.status ?? "ACTIVE",
    },
  });

  const onSubmit = (values: SupplierSchemaRequest) => {
    setError(null);

    start(async () => {
      const res =
        mode === "create"
          ? await createSupplierAction(values)
          : await updateSupplierAction(values);

      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }

      // @ts-ignore
      onCreated?.(res.data); // must include id + companyName
      toast.success(res.message);
      router.push("/dashboard/suppliers");
      router.refresh();
    });
  };

  return (
    <FormLayout
      title={mode === "create" ? "New Supplier" : "Edit Supplier"}
      description={
        mode === "create"
          ? "Create a supplier record for billing & quotations."
          : "Update supplier details."
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
            form="supplier-form"
            disabled={pending || !form.formState.isValid}>
            {pending ? (
              <LoadingButton></LoadingButton>
            ) : mode === "create" ? (
              "Create Supplier"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      }
      footerHint={<span>Tip: GSTIN is optional, but helps billing.</span>}>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form
          id="supplier-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5">
          {/* SECTION: Company */}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Explosion Proof Electrical Control"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="accounts@company.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional (recommended for sharing invoices).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98xxxxxxx" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional (useful for follow-ups).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="gstin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSTIN</FormLabel>
                  <FormControl>
                    <Input placeholder="24ABCDE1234F1Z5" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional. Used for GST invoices.
                  </FormDescription>
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
                  <FormDescription className="text-xs">
                    Inactive suppliers stay in records but can be hidden by
                    default.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Street / Area / Building" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Landmark / Additional info (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Vapi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Gujarat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="India" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="396001"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Optional: hidden submit button for Enter key */}
          <button type="submit" className="hidden" />
        </form>
      </Form>
    </FormLayout>
  );
}

