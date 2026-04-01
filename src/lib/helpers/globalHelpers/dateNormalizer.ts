type DraftDate =
  | Date
  | string
  | null
  | undefined
  | { $type?: "DateTime"; value?: string }
  | { value?: string };

export function draftToDate(value: DraftDate): Date | null {
  if (!value) return null;

  // already Date
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  // ISO string
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // superjson-ish object
  if (typeof value === "object") {
    const v = (value as any).value;
    if (typeof v === "string") {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

export function dateToISO(value: DraftDate): string | null {
  const d = draftToDate(value);
  return d ? d.toISOString() : null;
}
