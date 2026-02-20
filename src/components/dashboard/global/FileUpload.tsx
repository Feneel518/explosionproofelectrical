"use client";

import Image from "next/image";
import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductMediaKind } from "@prisma/client";

type MediaItem = {
  kind: ProductMediaKind;
  url: string;
  title?: string | undefined | null;
};

type FileUploadProps = {
  endpoint: "productImage" | "productDrawing" | "galleryImages";
  kind: ProductMediaKind; // e.g. "IMAGE" or "DRAWING"

  value?: MediaItem[] | undefined; // array now
  onChange: (next: MediaItem[]) => void;

  label?: string;
  hint?: string;
  className?: string;
};

export function FileUpload({
  endpoint,
  kind,
  value = [],
  onChange,
  label,
  hint,
  className,
}: FileUploadProps) {
  const [busy, setBusy] = useState(false);

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {(label || hint) && (
        <div className="space-y-1">
          {label ? <p className="text-sm font-medium">{label}</p> : null}
          {hint ? (
            <p className="text-sm text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      )}

      {/* Uploader */}
      <div className="rounded-2xl border bg-card p-3">
        <UploadDropzone
          endpoint={endpoint}
          onUploadBegin={() => setBusy(true)}
          onClientUploadComplete={(res) => {
            // UploadThing response fields differ by version.
            // Common fields: url, ufsUrl
            const files = (res ?? [])
              .map((f: any) => {
                const url = f.ufsUrl ?? f.url ?? null;
                const title = f.name ?? f.fileName ?? null;
                if (!url) return null;

                return { kind, url, title } satisfies MediaItem;
              })
              .filter(Boolean) as MediaItem[];

            onChange([...(value ?? []), ...files]);
            setBusy(false);
          }}
          onUploadError={(err) => {
            console.error(err);
            setBusy(false);
          }}
          className="ut-allowed-content:hidden ut-label:text-sm ut-button:rounded-xl ut-button:h-10"
          appearance={{
            container: "border-0 bg-transparent p-0 cursor-pointer group ",
            uploadIcon:
              "text-primary -mb-4 mt-2 group-hover:-translate-y-2 transition-all duration-300 ease-in-out",
            label:
              "text-sm font-medium text-foreground mb-4 font-sans group-hover:-translate-y-2 transition-all duration-300 ease-in-out",
            allowedContent: "text-xs text-muted-foreground",
            button: cn(
              "inline-flex items-center justify-center  whitespace-nowrap rounded-xl text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:hidden",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "h-10 px-4 py-2",
              busy && "opacity-60 pointer-events-none",
            ),
          }}
          content={{
            label: busy ? "Uploading…" : "Upload files",
            allowedContent: "PNG, JPG, PDF (as configured)",
            button: busy ? "Uploading…" : "Upload",
          }}
        />
      </div>

      {/* Preview grid */}
      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {value.map((m, idx) => (
            <div
              key={`${m.url}-${idx}`}
              className="overflow-hidden rounded-2xl border bg-card">
              <div className="relative aspect-square">
                <Image
                  src={m.url}
                  alt={m.title ?? "Uploaded"}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-t p-2">
                <p className="truncate text-[11px] text-muted-foreground">
                  {m.title ?? "File"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => removeAt(idx)}
                  disabled={busy}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* {value ? (
        <div className="relative overflow-hidden rounded-2xl border bg-card">
          <div className="relative size-40">
            <Image
              src={value}
              alt={label ?? "Uploaded image"}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t p-3">
            <p className="truncate text-xs text-muted-foreground">{value}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(null)}
              disabled={busy}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-3">
          <UploadDropzone
            endpoint={endpoint}
            onUploadBegin={() => setBusy(true)}
            onClientUploadComplete={(res) => {
             
              const url = res?.[0]?.ufsUrl ?? null;
              const next = [...]
              onChange(url);
              setBusy(false);
            }}
            onUploadError={(err) => {
              console.error(err);
              setBusy(false);
            }}
            className="ut-allowed-content:hidden ut-label:text-sm ut-button:rounded-xl ut-button:h-10"
            appearance={{
              container: "border-0 bg-transparent p-0 cursor-pointer  group",
              uploadIcon:
                "text-primary -mb-4 mt-2 group-hover:-translate-y-2 transition-all duration-300 ease-in-out",
              label:
                "text-sm font-medium text-foreground mb-4  font-sans group-hover:-translate-y-2 transition-all duration-300 ease-in-out",
              allowedContent: "text-xs text-muted-foreground",
              button: cn(
                // mimic ShadCN Button default
                "inline-flex items-center justify-center  -mt-4! whitespace-nowrap rounded-xl text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:hidden",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "h-10 px-4 py-2",
                busy && "opacity-60 pointer-events-none",
              ),
            }}
            // ✅ custom copy
            content={{
              label: busy ? "Uploading…" : "Upload an image",
              allowedContent: "PNG, JPG up to 4MB",
              button: busy ? "Uploading…" : "Upload image",
            }}
          />
        </div>
      )} */}
    </div>
  );
}
