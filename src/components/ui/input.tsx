"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  value,
  onChange,
  onBlur,
  inputMode,
  ...props
}: React.ComponentProps<"input">) {
  const [isTemporarilyEmpty, setIsTemporarilyEmpty] = React.useState(false);
  const isNumberInput = type === "number";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumberInput) {
      setIsTemporarilyEmpty(event.target.value === "");
    }
    onChange?.(event);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsTemporarilyEmpty(false);
    onBlur?.(event);
  };

  return (
    <input
      type={type}
      value={
        isNumberInput && isTemporarilyEmpty && value !== undefined ? "" : value
      }
      inputMode={inputMode ?? (isNumberInput ? "decimal" : undefined)}
      onChange={handleChange}
      onBlur={handleBlur}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/50 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-border h-9 w-full min-w-0 rounded-md border bg-accent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
