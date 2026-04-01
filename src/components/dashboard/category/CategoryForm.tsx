"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  CategorySchema,
  CategorySchemaRequest,
} from "@/lib/validators/dashboard/categories/CategoryValidator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormLayout from "../global/FormLayout";
import LoadingButton from "../global/LoadingButton";
import { createCategoryAction } from "@/lib/actions/dashboard/categories/createCatgeory";
import { updateCategoryAction } from "@/lib/actions/dashboard/categories/updateCategory";
import { normalizeSlug } from "@/lib/helpers/globalHelpers/normalizeSlug";

export default function CategoryForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Partial<CategorySchemaRequest>;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [status, setStatus] = React.useState<CategorySchemaRequest["status"]>(
    (initial?.status as any) ?? "ACTIVE",
  );
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CategorySchemaRequest>({
    resolver: zodResolver(CategorySchema) as any,
    defaultValues: {
      id: initial?.id ?? undefined,
      description: initial?.description ?? "",
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      status: initial?.status ?? "ACTIVE",
    },
  });

  React.useEffect(() => {
    form.setValue("slug", normalizeSlug(form.watch("name")));
  }, [form.watch("name")]);

  const onSubmit = (values: CategorySchemaRequest) => {
    setError(null);

    start(async () => {
      const res =
        mode === "create"
          ? await createCategoryAction(values)
          : await updateCategoryAction(values);

      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.push("/dashboard/categories");
      router.refresh();
    });
  };

  return (
    <FormLayout
      title={mode === "create" ? "New Category" : "Edit Category"}
      description={
        mode === "create"
          ? "Create a category record for products creation."
          : "Update catgeory details."
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
            form="category-form"
            disabled={pending || !form.formState.isValid}>
            {pending ? (
              <LoadingButton></LoadingButton>
            ) : mode === "create" ? (
              "Create Category"
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
          id="category-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5">
          {/* SECTION: Company */}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>Catgeory Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Flamproof Switch Gears"
                      {...field}
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
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="accounts@company.com"
                    {...field}
                    value={field.value!}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Optional (recommended for webiste catalog).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Optional: hidden submit button for Enter key */}
          <button type="submit" className="hidden" />
        </form>
      </Form>
    </FormLayout>
  );
}
