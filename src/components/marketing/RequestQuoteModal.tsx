"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuoteInquiryForm } from "@/components/marketing/QuoteInquiryForm";

export function RequestQuoteModal({
  productOptions,
}: {
  productOptions: string[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-fit bg-[#E46414] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_30px_rgba(228,100,20,0.32)]">
          Request a Quote
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-none border-white/14 bg-[#04121b] p-0 text-white shadow-[0_24px_90px_rgba(0,0,0,0.55)] sm:max-w-[720px]">
        <div className="border-b border-white/12 bg-[#061d2b] px-6 py-6 sm:px-8">
          <DialogHeader>
            <div className="font-[family-name:var(--font-marketing-mono)] text-xs uppercase tracking-[0.22em] text-[#F17D1E]">
              / SEND A REQUIREMENT
            </div>
            <DialogTitle className="font-[family-name:var(--font-marketing-display)] text-[44px] uppercase leading-none tracking-normal text-white sm:text-[56px]">
              Request a Quote
            </DialogTitle>
            <DialogDescription className="max-w-xl text-sm font-light leading-6 text-white/65">
              Share your product requirement and our team will get back with pricing, lead time and technical guidance.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-7 sm:px-8">
          <QuoteInquiryForm compact productOptions={productOptions} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
