"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { completeQuotationFollowupAction } from "@/lib/actions/dashboard/sales/quotation/completeQuotationFollowupAction";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followup: any | null;
};

type FormValues = {
  outcome: string;
  note: string;
};

export default function CompleteFollowupDialog({
  open,
  onOpenChange,
  followup,
}: Props) {
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      outcome: "OTHER",
      note: followup?.note || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      outcome: "OTHER",
      note: followup?.note || "",
    });
  }, [followup, form]);

  async function onSubmit(values: FormValues) {
    if (!followup?.id) return;

    try {
      setIsPending(true);
      const res = await completeQuotationFollowupAction({
        followupId: followup.id,
        outcome: values.outcome as any,
        note: values.note || null,
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success("Follow-up completed");
      window.dispatchEvent(new Event("quotation-followups-changed"));
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Follow-up</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OTHER">Followed Up</SelectItem>
                      <SelectItem value="INTERESTED">Interested</SelectItem>
                      <SelectItem value="NO_RESPONSE">No Response</SelectItem>
                      <SelectItem value="NEED_DISCOUNT">
                        Need Discount
                      </SelectItem>
                      <SelectItem value="NEED_REVISED_QUOTE">
                        Need Revised Quote
                      </SelectItem>
                      <SelectItem value="POSTPONED">Postponed</SelectItem>
                      <SelectItem value="WON">Approved</SelectItem>
                      <SelectItem value="LOST_TO_COMPETITOR">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="Add final follow-up note"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Completing..." : "Complete Follow-up"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
