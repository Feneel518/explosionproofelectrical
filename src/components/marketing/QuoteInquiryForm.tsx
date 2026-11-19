"use client";

import Image from "next/image";
import { FormEvent, ReactNode, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Popover as PopoverPrimitive } from "radix-ui";
import { submitQuoteInquiryAction } from "@/lib/actions/marketing/submitQuoteInquiryAction";
import { marketingAsset } from "@/lib/marketing/data";
import {
  fallbackProductInterestOptions,
  type QuoteInquiryRequest,
} from "@/lib/validators/marketing/QuoteInquiryValidator";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl bg-white/[0.04] border border-white/12 text-white font-[family-name:var(--font-site-sans)] text-[15px] px-4 py-3.5 outline-none focus:border-[#e46414] focus:bg-white/[0.07] transition-colors placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-2 font-[family-name:var(--font-site-mono)] text-[11px] uppercase tracking-[0.1em] text-white/50";

type FieldErrors = Partial<Record<keyof QuoteInquiryRequest, string[]>>;

type QuoteInquiryFormProps = {
  compact?: boolean;
  productOptions?: readonly string[];
};

function getInitialValues(productOptions: readonly string[]): QuoteInquiryRequest {
  return {
    fullName: "",
    company: "",
    email: "",
    phone: "",
    productInterest: productOptions[0] ?? "Custom Build / Other",
    quantity: "",
    requirement: "",
  };
}

export function QuoteInquiryForm({
  compact = false,
  productOptions = fallbackProductInterestOptions,
}: QuoteInquiryFormProps) {
  const options = productOptions.length > 0 ? productOptions : fallbackProductInterestOptions;
  const [values, setValues] = useState<QuoteInquiryRequest>(() =>
    getInitialValues(options),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<{
    kind: "idle" | "success" | "error";
    message?: string;
    warning?: string;
  }>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const setValue = (field: keyof QuoteInquiryRequest, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "idle" });

    startTransition(async () => {
      const result = await submitQuoteInquiryAction(values);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setStatus({ kind: "error", message: result.message });
        return;
      }

      setValues(getInitialValues(options));
      setFieldErrors({});
      setStatus({
        kind: "success",
        message: result.message,
        warning: undefined,
      });
    });
  };

  if (status.kind === "success") {
    return (
      <div className="rounded-2xl border border-[#e46414]/40 bg-[#e46414]/[0.08] p-8 text-center sm:p-10">
        <Image
          src={marketingAsset("flame.png")}
          alt=""
          width={64}
          height={64}
          className="mx-auto opacity-90 drop-shadow-[0_0_26px_rgba(228,100,20,0.4)]"
        />
        <div className="mt-5 font-[family-name:var(--font-site-sans)] text-[36px] font-medium tracking-[-0.04em] leading-none">
          REQUEST RECEIVED
        </div>
        <p className="mt-3 text-sm font-light leading-6 text-white/72">
          {status.message}
        </p>
        {status.warning ? (
          <p className="mt-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-xs leading-5 text-yellow-100">
            {status.warning}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-6 border-b border-[#e46414] pb-1 text-sm font-semibold">
          SEND ANOTHER -&gt;
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="FULL NAME *" error={fieldErrors.fullName?.[0]}>
          <input
            type="text"
            value={values.fullName}
            onChange={(event) => setValue("fullName", event.target.value)}
            placeholder="Your name"
            aria-label="Full name"
            disabled={isPending}
            className={inputClass}
          />
        </FormField>
        <FormField label="COMPANY" error={fieldErrors.company?.[0]}>
          <input
            type="text"
            value={values.company}
            onChange={(event) => setValue("company", event.target.value)}
            placeholder="Organisation"
            aria-label="Company"
            disabled={isPending}
            className={inputClass}
          />
        </FormField>
        <FormField label="EMAIL *" error={fieldErrors.email?.[0]}>
          <input
            type="email"
            value={values.email}
            onChange={(event) => setValue("email", event.target.value)}
            placeholder="you@company.com"
            aria-label="Email"
            disabled={isPending}
            className={inputClass}
          />
        </FormField>
        <FormField label="PHONE" error={fieldErrors.phone?.[0]}>
          <input
            type="tel"
            value={values.phone}
            onChange={(event) => setValue("phone", event.target.value)}
            placeholder="+91"
            aria-label="Phone"
            disabled={isPending}
            className={inputClass}
          />
        </FormField>
      </div>

      <div className={`mt-5 grid gap-5 ${compact ? "" : "sm:grid-cols-[1fr_0.55fr]"}`}>
        <FormField label="PRODUCT INTEREST" error={fieldErrors.productInterest?.[0]}>
          <ProductInterestCombobox
            value={values.productInterest}
            options={options}
            onChange={(value) => setValue("productInterest", value)}
            disabled={isPending}
          />
        </FormField>
        <FormField label="QUANTITY" error={fieldErrors.quantity?.[0]}>
          <input
            type="text"
            value={values.quantity}
            onChange={(event) => setValue("quantity", event.target.value)}
            placeholder="e.g. 12 Nos"
            aria-label="Quantity"
            disabled={isPending}
            className={inputClass}
          />
        </FormField>
      </div>

      <div className="mt-5">
        <FormField label="YOUR REQUIREMENT *" error={fieldErrors.requirement?.[0]}>
          <textarea
            rows={compact ? 4 : 5}
            value={values.requirement}
            onChange={(event) => setValue("requirement", event.target.value)}
            placeholder="Zone, gas group, load, quantity, timelines..."
            aria-label="Your requirement"
            disabled={isPending}
            className={`${inputClass} resize-y leading-6`}
          />
        </FormField>
      </div>

      {status.kind === "error" ? (
        <div className="mt-5 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {status.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-7 inline-flex h-auto items-center rounded-full bg-[#e46414] px-8 py-4 text-[15px] font-semibold text-white shadow-[0_12px_40px_-12px_rgba(228,100,20,0.6)] transition hover:bg-[#f17d1e] disabled:cursor-not-allowed disabled:opacity-60">
        {isPending ? "SENDING..." : "SEND REQUEST ->"}
      </button>
    </form>
  );
}

function ProductInterestCombobox({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dedupedOptions = useMemo(
    () =>
      Array.from(
        new Set(options.map((option) => option.trim()).filter(Boolean)),
      ),
    [options],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label="Product interest"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-[52px] w-full justify-between rounded-xl border-white/12 bg-white/[0.04] px-4 py-3.5 text-left font-[family-name:var(--font-site-sans)] text-[15px] font-normal text-white shadow-none hover:bg-white/[0.07] hover:text-white focus-visible:border-[#e46414] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60",
          )}>
          <span className="min-w-0 flex-1 truncate text-left">
            {value || "Select a product"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white/45" />
        </Button>
      </PopoverTrigger>
      <PopoverPrimitive.Content
        sideOffset={4}
        align="start"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        className="w-(--radix-popover-trigger-width) overflow-hidden rounded-xl border-white/12 bg-[#0a2b40] p-0 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
        <Command className="rounded-xl bg-[#0a2b40] text-white [&_[data-slot=command-input-wrapper]]:h-[50px] [&_[data-slot=command-input-wrapper]]:border-white/12 [&_[data-slot=command-input-wrapper]]:bg-[#072436] [&_[data-slot=command-input-wrapper]_svg]:text-white/45 [&_[data-slot=command-input]]:bg-transparent [&_[data-slot=command-input]]:text-white [&_[data-slot=command-input]]:placeholder:text-white/35">
          <CommandInput
            placeholder="Search products..."
            className="text-white placeholder:text-white/35"
          />
          <CommandList className="h-[240px] max-h-[240px] overflow-x-hidden overflow-y-scroll overscroll-contain">
            <CommandEmpty className="py-8 text-center text-sm text-white/55">
              No products found.
            </CommandEmpty>
            <CommandGroup className="p-1">
              {dedupedOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-lg px-3 py-3 text-sm text-white data-[selected=true]:bg-[#e46414] data-[selected=true]:text-white">
                  <span className="min-w-0 flex-1 truncate">{option}</span>
                  {value === option ? (
                    <Check className="h-4 w-4 shrink-0 text-[#F17D1E]" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverPrimitive.Content>
    </Popover>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className={labelClass}>{label}</div>
      {children}
      {error ? <div className="mt-2 text-xs text-red-200">{error}</div> : null}
    </div>
  );
}
