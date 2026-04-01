"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
  CustomerSchema,
  CustomerSchemaRequest,
} from "@/lib/validators/dashboard/customers/CustomerValidator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createCustomerAction } from "@/lib/actions/dashboard/customers/CreateCustomer";
import { updateCustomerAction } from "@/lib/actions/dashboard/customers/UpdateCustomer";
import { Spinner } from "@/components/ui/spinner";
import LoadingButton from "../global/LoadingButton";
import {
  ProductSchema,
  ProductSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductValidator";
import { ZONES } from "@/lib/constants/zones";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { normalizeSlug } from "@/lib/helpers/globalHelpers/normalizeSlug";
import { createProductAction } from "@/lib/actions/dashboard/products/CreateProduct";
import { updateProductAction } from "@/lib/actions/dashboard/products/updateProductAction";

export default function ProductForm({
  mode,
  customerId,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  customerId?: string;
  initial?: Partial<ProductSchemaRequest>;
  categories: { id: string; name: string }[];
}) {
  const firstInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ProductSchemaRequest>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: {
      id: initial?.id ?? undefined,
      name: initial?.name ?? "FLP/WP ",
      slug: initial?.slug ?? "",
      zones: initial?.zones ?? ["Zone-0", "Zone-1", "Zone-2"], // 👈 default checked,
      status: initial?.status ?? "ACTIVE",
      flpType: initial?.flpType ?? "Flameproof as per IEC:60079-1:2014",
      protection: initial?.protection ?? "IP-66 as per IS/IEC:60079-1",
      gasGroup: initial?.gasGroup ?? "IIA, IIB & IIC as per IS/IEC:60079-1",
      material: initial?.material ?? "Cast Aluminum Alloy LM-6",
      finish: initial?.finish ?? "Powder Coated RAL-7032",
      hardware: initial?.hardware ?? "SS 304",
      hsnCode: initial?.hsnCode ?? "",
      categoryId: initial?.categoryId ?? "",
      longDesc: initial?.longDesc ?? "",
      shortDesc: initial?.shortDesc ?? "",
    },
  });

  React.useEffect(() => {
    form.setValue("slug", normalizeSlug(form.watch("name")));
  }, [form.watch("name")]);

  React.useEffect(() => {
    const el = firstInputRef.current;
    if (!el) return;

    el.focus();
    const length = el.value.length;
    el.setSelectionRange(length, length); // cursor at end
  }, []);
  const onSubmit = (values: ProductSchemaRequest) => {
    setError(null);

    start(async () => {
      const res =
        mode === "create"
          ? await createProductAction(values)
          : await updateProductAction(values);

      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.push("/dashboard/products");
      router.refresh();
    });


  };

  return (
    <FormLayout
      title={mode === "create" ? "New Product" : "Edit Product"}
      description={
        mode === "create"
          ? "Create a product record for billing & quotations."
          : "Update product details."
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
            form="product-form"
            disabled={pending || !form.formState.isValid}>
            {pending ? (
              <LoadingButton></LoadingButton>
            ) : mode === "create" ? (
              "Create Product"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      }>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form
          id="product-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5">
          {/* SECTION: Company */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ">
            {/* NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FLP/WP Well Glass"
                      {...field}
                      ref={firstInputRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SLUG */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="flp-wp-well-glass"
                      {...field}
                      readOnly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TECHNICAL FIELDS GRID */}

            {[
              {
                name: "flpType",
                label: "Flameproof Type",
                placeholder: "Flameproof as per IEC:60079-1:2014",
              },
              {
                name: "protection",
                label: "Protection",
                placeholder: "IP-66 as per IS/IEC:60079-1",
              },
              {
                name: "gasGroup",
                label: "Gas Group",
                placeholder: "IIA, IIB & IIC as per IS/IEC:60079-1",
              },
              {
                name: "material",
                label: "Material",
                placeholder: "Cast Aluminum Alloy LM-6",
              },
              {
                name: "finish",
                label: "Finish",
                placeholder: "Powder Coated RAL-7032",
              },
              {
                name: "hardware",
                label: "Hardware",
                placeholder: "SS 304",
              },
              {
                name: "hsnCode",
                label: "HSN Code",
                placeholder: "85372000",
              },
            ].map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{item.label}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={item.placeholder} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {/* CATEGORY */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ZONES */}
            <FormField
              control={form.control}
              name="zones"
              render={() => (
                <FormItem>
                  <FormLabel>Zones</FormLabel>
                  <div className="flex gap-6">
                    {ZONES.map((zone) => (
                      <FormField
                        key={zone}
                        control={form.control}
                        name="zones"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={zone}
                              className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(zone)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, zone])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== zone,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {zone}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* STATUS */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* DESCRIPTIONS */}
            <FormField
              control={form.control}
              name="shortDesc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      value={field.value!}
                      placeholder="Description to show on product details page."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longDesc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Long Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      {...field}
                      value={field.value!}
                      placeholder="Description to show on product details page."
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
