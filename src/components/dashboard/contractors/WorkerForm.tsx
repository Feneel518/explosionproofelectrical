"use client";

import * as React from "react";
import { useRouter } from "nextjs-toploader/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import z from "zod";
import {
  WorkerSchema,
  WorkerSchemaRequest,
} from "@/lib/validators/dashboard/contractors/WorkerValidator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import LoadingButton from "../global/LoadingButton";
import { DatePicker } from "@/components/ui/date-picker";
import { createWorkerAction } from "@/lib/actions/dashboard/contractors/workers/CreateWorker";
import { updateWorkerAction } from "@/lib/actions/dashboard/contractors/workers/UpdateWorker";

const ROLE_OPTIONS = [
  "TURNER",
  "ASSEMBLY",
  "POLISHING",
  "PAINTING",
  "HELPER",
  "OTHER",
] as const;

type WorkerRoleValue = (typeof ROLE_OPTIONS)[number];
type WorkerStatusValue = "ACTIVE" | "INACTIVE";

type Initial = Omit<Partial<WorkerSchemaRequest>, "joinedAt"> & {
  joinedAt?: string | null;
};

type WorkerFormValues = z.input<typeof WorkerSchema>;

export default function WorkerForm({
  mode,
  initial,
  workerKind = "MACHINING",
}: {
  mode: "create" | "edit";
  initial?: Initial;
  workerKind?: "MACHINING" | "CASTING";
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const joinedAtDefault = initial?.joinedAt ?? "";

  const form = useForm<WorkerFormValues, unknown, WorkerSchemaRequest>({
    resolver: zodResolver(WorkerSchema),
    defaultValues: {
      id: initial?.id ?? undefined,
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      role: (initial?.role as WorkerRoleValue | undefined) ?? "TURNER",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      address: initial?.address ?? "",
      joinedAt: joinedAtDefault,
      notes: initial?.notes ?? "",
      status: (initial?.status as WorkerStatusValue | undefined) ?? "ACTIVE",
      kind: workerKind,
    },
  });

  const onSubmit = (values: WorkerSchemaRequest) => {
    setError(null);
    start(async () => {
      const res =
        mode === "create"
          ? await createWorkerAction(values)
          : await updateWorkerAction(values);

      if (!res.ok) {
        setError(res.message);
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.push(workerKind === "CASTING" ? "/dashboard/casting-workers" : "/dashboard/contractors/workers");
      router.refresh();
    });
  };

  return (
    <FormLayout
      title={mode === "create" ? `New ${workerKind === "CASTING" ? "Casting " : ""}Worker` : "Edit Worker"}
      description={
        mode === "create"
          ? workerKind === "CASTING"
            ? "Add a worker who receives aluminum and returns castings."
            : "Add a contractor / piece-rate worker (turner, assembly, etc.)."
          : "Update worker details."
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
          <Button type="submit" form="worker-form" disabled={pending}>
            {pending ? <LoadingButton /> : mode === "create" ? "Create Worker" : "Save Changes"}
          </Button>
        </div>
      }
      footerHint={<span>Tip: Use a short, unique code like W001 or T001 — easier to reference in entries.</span>}
    >
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form id="worker-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. W001" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Auto uppercase, must be unique.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Rahul" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {workerKind === "MACHINING" ? <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            /> : null}

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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+91 98xxxxxxxx" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="(optional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="joinedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Joining Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={typeof field.value === "string" ? field.value : ""}
                      onChange={(value) => field.onChange(value || null)}
                      placeholder="Pick joining date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Worker's address (optional)"
                    rows={2}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any internal notes about this worker"
                    rows={3}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button type="submit" className="hidden" />
        </form>
      </Form>
    </FormLayout>
  );
}
