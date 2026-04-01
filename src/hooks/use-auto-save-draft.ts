import { saveQuotationDraftSnapshotAction } from "@/lib/actions/dashboard/sales/quotation/saveQuotationDraftSnapshotAction";
import { QuotationDraftData } from "@/lib/types/QuotationType";
import React from "react";
import { UseFormReturn } from "react-hook-form";

export function useQuotationDraftAutosave({
  getDraft,
  initialVersion,
  quotationId,
  debounceMs = 1200,
  enabled = true,
}: {
  quotationId: string;
  initialVersion: number;
  getDraft: () => QuotationDraftData; // return latest form snapshot
  enabled?: boolean;
  debounceMs?: number;
}) {
  const [version, setVersion] = React.useState(initialVersion);
  const [status, setStatus] = React.useState<
    "idle" | "saving" | "saved" | "error" | "conflict"
  >("idle");

  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  const timerRef = React.useRef<number | null>(null);
  const inflightRef = React.useRef(false);

  const triggerSave = React.useCallback(() => {
    if (!enabled) return;
    if (inflightRef.current) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(async () => {
      inflightRef.current = true;
      setStatus("saving");

      const draft = getDraft();
      const res = await saveQuotationDraftSnapshotAction({
        quotationId: quotationId,
        draft,
        clientVersion: version,
      });

      inflightRef.current = false;

      if (!res.ok) {
        if ((res as any).code === "VERSION_CONFLICT") {
          setStatus("conflict");
        } else {
          setStatus("error");
        }
        return;
      }

      setVersion(res.serverVersion);
      setSavedAt(res.savedAt);
      setStatus("saved");
    }, debounceMs);
  }, [enabled, debounceMs, getDraft, version]);

  // optional cleanup
  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { triggerSave, status, savedAt, version, setVersion, setStatus };
}
