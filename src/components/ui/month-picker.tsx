"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MonthPickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

function parseMonthYear(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return undefined;

  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Pick a month",
}: MonthPickerProps) {
  const selectedMonth = React.useMemo(() => parseMonthYear(value), [value]);
  const currentYear = new Date().getFullYear();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedMonth && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedMonth ? format(selectedMonth, "MMMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedMonth}
          month={selectedMonth}
          onMonthChange={(month) => onChange(format(month, "yyyy-MM"))}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM") : undefined)}
          captionLayout="dropdown"
          startMonth={new Date(currentYear - 10, 0, 1)}
          endMonth={new Date(currentYear + 10, 11, 1)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
