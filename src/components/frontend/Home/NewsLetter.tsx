"use client";

import * as React from "react";
import { Bebas_Neue } from "next/font/google";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { submitNewsletterLeadAction } from "@/lib/actions/frontend/contactActions";

const bebas = Bebas_Neue({
  weight: ["400"],
  subsets: ["latin"],
});

type NewsletterForm = {
  name: string;
  email: string;
  companyName: string;
};

export default function NewsLetter() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<NewsletterForm>({
    name: "",
    email: "",
    companyName: "",
  });

  const update = (key: keyof NewsletterForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.companyName.trim()) {
      toast.error("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await submitNewsletterLeadAction({
        name: form.name,
        email: form.email,
        companyName: form.companyName,
      });

      if (!response.ok) {
        toast.error(response.message);
        return;
      }

      setSubmitted(true);
      toast.success(response.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="newsletter"
      className="relative mt-14 border-b border-white py-10  md:py-16">
      {submitted ? (
        <div className="py-10">
          <h3
            className={cn("text-center text-5xl md:text-6xl", bebas.className)}>
            THANKS FOR JOINING OUR NETWORK
          </h3>
          <div className="mx-auto mt-3 h-1 w-28 border-grow-x" />
        </div>
      ) : (
        <>
          <h3
            className={cn(
              "text-center text-5xl tracking-wide md:text-6xl",
              bebas.className,
            )}>
            BE A PART OF OUR FAMILY IN INDIA
          </h3>
          <div className="mx-auto mb-6 mt-3 h-1 w-28 border-grow-x" />

          <form
            onSubmit={onSubmit}
            className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-center gap-5 md:gap-8">
            <div className="grid w-full grid-cols-1 gap-4 px-2 md:grid-cols-3 md:gap-8">
              <Input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="h-14 border-0 border-b border-white rounded-none bg-transparent px-2 text-lg placeholder:text-white/80 focus-visible:ring-0"
                placeholder="Full Name"
                autoComplete="off"
              />
              <Input
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                className="h-14 border-0 border-b border-white rounded-none bg-transparent px-2 text-lg placeholder:text-white/80 focus-visible:ring-0"
                type="email"
                placeholder="Email Address"
                autoComplete="off"
              />
              <Input
                value={form.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                className="h-14 border-0 border-b border-white rounded-none bg-transparent px-2 text-lg placeholder:text-white/80 focus-visible:ring-0"
                placeholder="Company Name"
                autoComplete="off"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="ghost"
              className="h-12  cursor-pointer mt-4 inline-flex w-fit border-b border-white pb-0.5 text-xl rounded-none hover:bg-transparent tracking-wider transition-all hover:text-primary">
              {loading ? "SUBSCRIBING..." : "SUBSCRIBE"}
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
