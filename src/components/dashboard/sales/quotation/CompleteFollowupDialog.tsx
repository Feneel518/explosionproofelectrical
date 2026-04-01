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
      outcome: "FOLLOWED_UP",
      note: followup?.note || "",
    },
  });

  React.useEffect(() => {
    form.reset({
      outcome: "FOLLOWED_UP",
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
                      <SelectItem value="FOLLOWED_UP">Followed Up</SelectItem>
                      <SelectItem value="INTERESTED">Interested</SelectItem>
                      <SelectItem value="NOT_INTERESTED">
                        Not Interested
                      </SelectItem>
                      <SelectItem value="REVISED_QUOTE_REQUIRED">
                        Revised Quote Required
                      </SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
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
