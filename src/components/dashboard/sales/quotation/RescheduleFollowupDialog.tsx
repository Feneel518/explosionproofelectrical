"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { rescheduleQuotationFollowupAction } from "@/lib/actions/dashboard/sales/quotation/rescheduleQuotationFollowupAction";
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
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followup: any | null;
};

type FormValues = {
  scheduledAt: Date | null;
  note: string;
};

export default function RescheduleFollowupDialog({
  open,
  onOpenChange,
  followup,
}: Props) {
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      scheduledAt: followup?.scheduledAt
        ? new Date(followup.scheduledAt)
        : null,
      note: followup?.note || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      scheduledAt: followup?.scheduledAt
        ? new Date(followup.scheduledAt)
        : null,
      note: followup?.note || "",
    });
  }, [followup, form]);

  async function onSubmit(values: FormValues) {
    if (!followup?.id || !values.scheduledAt) {
      toast.error("Please select a follow-up date");
      return;
    }

    try {
      setIsPending(true);
      const res = await rescheduleQuotationFollowupAction({
        followupId: followup.id,
        scheduledAt: values.scheduledAt,
        note: values.note || null,
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success("Follow-up rescheduled");
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Follow-up</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>New Date</FormLabel>

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
                    <Textarea {...field} placeholder="Update follow-up note" />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
