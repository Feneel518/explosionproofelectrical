"use client";

import * as React from "react";
import { addDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
};

const PRESETS = [
  { label: "Today", value: 0 },
  { label: "Tomorrow", value: 1 },
  { label: "In 3 days", value: 3 },
  { label: "In a week", value: 7 },
  { label: "In 2 weeks", value: 14 },
];

export function FollowUpDatePicker({ value, onChange }: Props) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    const d = value ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  React.useEffect(() => {
    const d = value ?? new Date();
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [value]);

  return (
    <Card className="w-fit max-w-[320px]">
      <CardContent className="p-3">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => onChange(d ?? null)}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          fixedWeeks
          className="p-0 [--cell-size:--spacing(9.5)]"
        />
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 border-t p-3">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              const newDate = addDays(new Date(), preset.value);
              onChange(newDate);
              setCurrentMonth(
                new Date(newDate.getFullYear(), newDate.getMonth(), 1),
              );
            }}>
            {preset.label}
          </Button>
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onChange(null)}>
          Clear date
        </Button>
      </CardFooter>
    </Card>
  );
}
