"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { submitProductEnquiryAction } from "@/lib/actions/frontend/contactActions";

type ProductEnquiryDialogProps = {
  productName?: string;
};

type EnquiryForm = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  message: string;
};

const getInitialForm = (productName?: string): EnquiryForm => ({
  name: "",
  email: "",
  phone: "",
  companyName: "",
  message: productName
    ? `Hello, I am interested in ${productName}. Please share details.`
    : "",
});

export default function ProductEnquiryDialog({
  productName,
}: ProductEnquiryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, startTransition] = React.useTransition();
  const [form, setForm] = React.useState<EnquiryForm>(
    getInitialForm(productName),
  );

  React.useEffect(() => {
    if (!open) {
      setForm(getInitialForm(productName));
    }
  }, [open, productName]);

  const update = (key: keyof EnquiryForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const response = await submitProductEnquiryAction({
        productName,
        name: form.name,
        email: form.email,
        phone: form.phone,
        companyName: form.companyName,
        message: form.message,
      });

      if (!response.ok) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="mt-4 inline-flex w-fit rounded-none border-b border-white pb-0.5 text-sm tracking-wider transition-all hover:bg-transparent hover:text-primary">
          ENQUIRE NOW
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl border border-white bg-background text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Product Enquiry</DialogTitle>
          <DialogDescription className="text-white/80">
            {productName
              ? `Send enquiry for ${productName}.`
              : "Send your enquiry to our sales team."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Full Name"
              className=" text-white placeholder:text-white/70"
            />
            <Input
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              type="email"
              placeholder="Email"
              className=" text-white placeholder:text-white/70"
            />
            <Input
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="Phone Number"
              className=" text-white placeholder:text-white/70"
            />
            <Input
              value={form.companyName}
              onChange={(event) => update("companyName", event.target.value)}
              placeholder="Company Name (Optional)"
              className=" text-white placeholder:text-white/70"
            />
          </div>

          <Textarea
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
            placeholder="Write your requirement..."
            rows={5}
            className=" text-white placeholder:text-white/70"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="border  text-white hover:bg-white hover:text-black">
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                "Submit Enquiry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
