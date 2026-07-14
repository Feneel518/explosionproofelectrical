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
  "w-full bg-[#061d2b] border border-white/16 text-white font-[family-name:var(--font-marketing-sans)] text-sm px-4 py-3.5 outline-none focus:border-[#E46414] transition-colors placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-2.5 font-[family-name:var(--font-marketing-mono)] text-[11px] uppercase tracking-[0.12em] text-white/55";

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
        warning: result.emailWarning,
      });
    });
  };

  if (status.kind === "success") {
    return (
      <div className="border border-[#E46414]/45 bg-[#E46414]/08 p-8 text-center sm:p-10">
        <Image
          src={marketingAsset("flame.png")}
          alt=""
          width={64}
          height={64}
          className="mx-auto opacity-90 drop-shadow-[0_0_26px_rgba(228,100,20,0.4)]"
        />
        <div className="mt-5 font-[family-name:var(--font-marketing-display)] text-[42px] uppercase leading-none">
          REQUEST RECEIVED
        </div>
        <p className="mt-3 text-sm font-light leading-6 text-white/72">
          {status.message}
        </p>
        {status.warning ? (
          <p className="mt-3 border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-xs leading-5 text-yellow-100">
            {status.warning}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-6 border-b border-[#E46414] pb-1 text-sm font-semibold uppercase tracking-[0.1em]">
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
            disabled={isPending}
            className={`${inputClass} resize-y leading-6`}
          />
        </FormField>
      </div>

      {status.kind === "error" ? (
        <div className="mt-5 border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {status.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-7 inline-block bg-[#E46414] px-9 py-4 text-sm font-bold uppercase tracking-[0.1em] shadow-[0_12px_40px_rgba(228,100,20,0.34)] disabled:cursor-not-allowed disabled:opacity-60">
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
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-[50px] w-full justify-between rounded-none border-white/16 bg-[#061d2b] px-4 py-3.5 text-left font-[family-name:var(--font-marketing-sans)] text-sm font-normal text-white shadow-none hover:bg-[#061d2b] hover:text-white focus-visible:border-[#E46414] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60",
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
        className="w-(--radix-popover-trigger-width) rounded-none border-white/16 bg-[#061d2b] p-0 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
        <Command className="rounded-none bg-[#061d2b] text-white [&_[data-slot=command-input-wrapper]]:h-[50px] [&_[data-slot=command-input-wrapper]]:border-white/16 [&_[data-slot=command-input-wrapper]]:bg-[#04121b] [&_[data-slot=command-input-wrapper]_svg]:text-white/45 [&_[data-slot=command-input]]:bg-transparent [&_[data-slot=command-input]]:text-white [&_[data-slot=command-input]]:placeholder:text-white/35">
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
                  className="cursor-pointer rounded-none px-3 py-3 text-sm text-white data-[selected=true]:bg-[#E46414] data-[selected=true]:text-white">
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
