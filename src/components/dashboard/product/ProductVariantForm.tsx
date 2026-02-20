import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createProductVariantAction } from "@/lib/actions/dashboard/products/CreateProductVariant";
import { updateProductVariantAction } from "@/lib/actions/dashboard/products/UpdateProductVariant";
import { buildBaseSku } from "@/lib/helpers/globalHelpers/normalizeSlug";
import { Variant } from "@/lib/types/FullVariant";
import {
  ProductVariantSchema,
  ProductVariantSchemaRequest,
} from "@/lib/validators/dashboard/products/ProductVariantValidator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileUpload } from "../global/FileUpload";
import FormLayout from "../global/FormLayout";
import LoadingButton from "../global/LoadingButton";

interface ProductVariantFormProps {
  mode: "create" | "edit";
  productId: string;
  productName: string;
  variant?: Variant;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

const ProductVariantForm: FC<ProductVariantFormProps> = ({
  mode,
  productId,
  productName,
  variant,
  onOpenChange,
}) => {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProductVariantSchemaRequest>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: {
      id: variant?.id ?? undefined,
      productId,
      cableEntry: variant?.cableEntry ?? "",
      cutoutSize: variant?.cutoutSize ?? "",
      drawings: variant?.drawings
        ? variant?.drawings.map((dwg) => {
            return {
              id: dwg.id ?? "",
              kind: dwg.kind,
              title: dwg.title ?? "",
              url: dwg.url ?? "",
            };
          })
        : [],
      earthing: variant?.earthing ?? "",
      gasket: variant?.gasket ?? "",
      glass: variant?.glass ?? "",
      horsePower: variant?.horsePower ?? "",
      kW: variant?.kW ?? "",
      mounting: variant?.mounting ?? "",
      plateSize: variant?.plateSize ?? "",
      rating: variant?.rating ?? "",
      images: variant?.image
        ? variant?.image.map((img) => {
            return {
              id: img.id ?? "",

              kind: img.kind,
              title: img.title ?? "",
              url: img.url ?? "",
            };
          })
        : [],
      rpm: variant?.rpm ?? "",
      size: variant?.size ?? "",
      sku: variant?.sku ?? "",
      status: variant?.status ?? "ACTIVE",
      terminals: variant?.terminals ?? "",
      typeNumber: variant?.typeNumber ?? "",
      variant: variant?.variant ?? "",
      wireGuard: variant?.wireGuard ?? "",
      component: variant?.component
        ? variant.component.map((comp) => {
            return {
              id: comp.id ?? "",

              item: comp.item ?? " ",
              unit: comp.unit ?? "",
            };
          })
        : [{ item: "", unit: "" }],
    },
    mode: "onChange",
  });

  const { append, fields, remove } = useFieldArray({
    name: "component",
    control: form.control,
  });

  const variantName = form.watch("variant");

  useEffect(() => {
    if (variantName) {
      form.setValue("sku", buildBaseSku(productName, form.watch("variant")));
    }
  }, [variantName]);

  const onSubmit = (values: ProductVariantSchemaRequest) => {
    setError(null);

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProductVariantAction(values)
          : await updateProductVariantAction(values);

      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.push(`/dashboard/products/${productId}`);
      router.refresh();
      onOpenChange(false);
      form.reset();
    });
  };

  return (
    <FormLayout
      title={mode === "create" ? "New Variant" : "Edit Variant"}
      description={
        mode === "create"
          ? "Create a product record for billing & quotations."
          : "Update product details."
      }
      footerHint={
        <div className="text-xl md:text-3xl max-md:hidden">{productName}</div>
      }>
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* SECTION: Company */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ">
            {/* NAME */}
            <FormField
              control={form.control}
              name="variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="45W" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Sku</FormLabel>
                  <FormControl>
                    <Input placeholder="45W" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {[
              {
                name: "typeNumber",
                label: "Type Number",
                placeholder: "Flameproof as per IEC:60079-1:2014",
              },
              {
                name: "rating",
                label: "rating",
                placeholder: "IP-66 as per IS/IEC:60079-1",
              },
              {
                name: "terminals",
                label: "Terminals",
                placeholder: "IIA, IIB & IIC as per IS/IEC:60079-1",
              },
              {
                name: "gasket",
                label: "Gasket",
                placeholder: "Cast Aluminum Alloy LM-6",
              },
              {
                name: "mounting",
                label: "Mounting",
                placeholder: "Powder Coated RAL-7032",
              },
              {
                name: "cableEntry",
                label: "Cable Entries",
                placeholder: "SS 304",
              },
              {
                name: "earthing",
                label: "Earthing",
                placeholder: "85372000",
              },
              {
                name: "cutoutSize",
                label: "Cutout Size",
                placeholder: "85372000",
              },
              {
                name: "plateSize",
                label: "Plate Size",
                placeholder: "85372000",
              },
              {
                name: "size",
                label: "Size",
                placeholder: "85372000",
              },
              {
                name: "glass",
                label: "Glass",
                placeholder: "85372000",
              },
              {
                name: "wireGuard",
                label: "Wire Guard",
                placeholder: "85372000",
              },
              {
                name: "rpm",
                label: "R.P.M",
                placeholder: "85372000",
              },
              {
                name: "kW",
                label: "K.W",
                placeholder: "85372000",
              },
              {
                name: "horsePower",
                label: "Horse Power",
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

            {/* SLUG */}
          </div>

          <div className=" grid gap-4 border p-4">
            <div className="flex  items-center justify-between">
              <FormLabel>Variant Components</FormLabel>
              <Button
                type="button"
                onClick={() => {
                  append({
                    item: "",
                    unit: "",
                  });
                }}>
                Add Component
              </Button>
            </div>

            <Separator className="my-2"></Separator>
            {fields.map((field, index) => {
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-5 gap-4 items-end">
                  <FormField
                    control={form.control}
                    name={`component.${index}.item`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Item</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={"Rotary Switch - 01 Nos"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`component.${index}.unit`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Units</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={"Rotary Switch - 01 Nos"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    onClick={() => {
                      remove(index);
                    }}
                    disabled={fields.length === 1}
                    variant={"secondary"}
                    type="button">
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      endpoint="productImage"
                      kind={"IMAGE"}
                      value={form.watch("images") ?? []}
                      onChange={(next) =>
                        form.setValue("images", next, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      label="Upload Images"
                      hint="PNG or JPG. Recommended: 512×512."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="drawings"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      endpoint="productDrawing"
                      kind={"DRAWING"}
                      value={form.watch("drawings") ?? []}
                      onChange={(next) =>
                        form.setValue("drawings", next, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      label="Upload Drawings"
                      hint="PNG or JPG. Recommended: 512×512."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}>
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isPending || !form.formState.isValid}>
              {isPending ? (
                <LoadingButton></LoadingButton>
              ) : mode === "create" ? (
                "Create Product Variant"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
          {/* Optional: hidden submit button for Enter key */}
          <button type="submit" className="hidden" />
        </form>
      </Form>
    </FormLayout>
  );
};

export default ProductVariantForm;
