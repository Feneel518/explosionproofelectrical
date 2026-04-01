"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { scheduleQuotationFollowupAction } from "@/lib/actions/dashboard/sales/quotation/scheduleQuotationFollwupAction";

const PRESETS = [
  { label: "Today", value: 0 },
  { label: "Tomorrow", value: 1 },
  { label: "In 3 days", value: 3 },
  { label: "In a week", value: 7 },
  { label: "In 2 weeks", value: 14 },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
};

type FormValues = {
  scheduledAt: Date | null;
  note: string;
};

export default function ScheduleFollowupDialog({
  open,
  onOpenChange,
  quotationId,
}: Props) {
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      scheduledAt: addDays(new Date(), 7),
      note: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (!values.scheduledAt) {
      toast.error("Please select a follow-up date");
      return;
    }

    try {
      setIsPending(true);
      const res = await scheduleQuotationFollowupAction({
        quotationId,
        scheduledAt: values.scheduledAt,
        note: values.note || null,
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success("Follow-up scheduled");
      onOpenChange(false);
      form.reset({
        scheduledAt: addDays(new Date(), 7),
        note: "",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Follow-up Date</FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={(date) => field.onChange(date ?? null)}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          field.onChange(addDays(new Date(), preset.value))
                        }>
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Call customer regarding approval / revision / payment terms..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
