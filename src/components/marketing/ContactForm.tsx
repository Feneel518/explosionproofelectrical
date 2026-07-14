"use client";

import { QuoteInquiryForm } from "@/components/marketing/QuoteInquiryForm";

export function ContactForm({ productOptions }: { productOptions: string[] }) {
  return <QuoteInquiryForm productOptions={productOptions} />;
}
