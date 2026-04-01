"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";

interface PdfPreviewCardProps {
  url: string;
  title?: string | null;
  height?: number;
}

export default function PdfPreviewCard({
  url,
  title,
  height = 420,
}: PdfPreviewCardProps) {
  const pdfSrc = `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {title || "Technical Drawing"}
            </div>
            <div className="text-xs text-muted-foreground">PDF Preview</div>
          </div>
        </div>

        <Button asChild size="sm" variant="outline">
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Full PDF
          </a>
        </Button>
      </div>

      <div
        className="relative w-full overflow-hidden bg-muted/20"
        style={{ height }}>
        <iframe
          src={pdfSrc}
          title={title || "Technical Drawing PDF"}
          className="absolute inset-0 h-full w-full border-0"
          scrolling="no"
        />

        {/* top soft overlay for cleaner edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-linear-to-b from-background/90 to-transparent" />

        {/* bottom fade so cropped PDF looks intentional */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent" />
      </div>
    </div>
  );
}
