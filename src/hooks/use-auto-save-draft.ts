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

  const runSave = React.useCallback(async () => {
    if (!enabled) return { ok: false as const, skipped: true as const };
    if (inflightRef.current) {
      return { ok: false as const, skipped: true as const };
    }

    inflightRef.current = true;
    setStatus("saving");

    try {
      const draft = getDraft();
      const res = await saveQuotationDraftSnapshotAction({
        quotationId,
        draft,
        clientVersion: version,
      });

      if (!res.ok) {
        if ((res as any).code === "VERSION_CONFLICT") {
          setStatus("conflict");
        } else {
          setStatus("error");
        }
        return res;
      }

      setVersion(res.serverVersion);
      setSavedAt(res.savedAt);
      setStatus("saved");
      return res;
    } finally {
      inflightRef.current = false;
    }
  }, [enabled, getDraft, quotationId, version]);

  const triggerSave = React.useCallback(() => {
    if (!enabled) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      runSave();
    }, debounceMs);
  }, [enabled, debounceMs, runSave]);

  const flushSave = React.useCallback(async () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return await runSave();
  }, [runSave]);

  // optional cleanup
  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return {
    triggerSave,
    flushSave,
    status,
    savedAt,
    version,
    setVersion,
    setStatus,
  };
}
