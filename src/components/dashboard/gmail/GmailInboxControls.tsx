"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InboxSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue placeholder={label} /></SelectTrigger><SelectContent><SelectGroup>{options.map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectGroup></SelectContent></Select>;
}

export const mailDate = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
export const fileSize = (bytes: number) => bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
export const attachmentUrl = (id: string, messageId: string, partId: string, preview = false) => `/api/gmail/attachments?${new URLSearchParams({ id, messageId, partId, ...(preview ? { preview: "1" } : {}) })}`;
