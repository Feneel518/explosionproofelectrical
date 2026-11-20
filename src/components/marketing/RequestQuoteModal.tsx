"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowUpRight } from "lucide-react";
import { QuoteInquiryForm } from "@/components/marketing/QuoteInquiryForm";
import { cn } from "@/lib/utils";
import styles from "./quote-dialog.module.css";

export function RequestQuoteModal({
  productOptions,
  contentClassName,
  triggerLabel = "Request a quote",
  triggerClassName,
}: {
  productOptions: string[];
  contentClassName?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={cn(styles.trigger, triggerClassName)}>
          {triggerLabel} <ArrowUpRight size={17} aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className={cn(styles.dialog, contentClassName)}>
        <div className={styles.head}>
          <DialogHeader>
            <div className={styles.eyebrow}>Send a requirement</div>
            <DialogTitle className={styles.title}>
              Request a <em>quote</em>
            </DialogTitle>
            <DialogDescription className={styles.description}>
              Share your product requirement and our team will get back with pricing, lead time and technical guidance.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className={styles.body}>
          <QuoteInquiryForm compact productOptions={productOptions} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
