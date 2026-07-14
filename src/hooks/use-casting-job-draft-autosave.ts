import React from "react";

import { saveCastingJobDraftSnapshotAction } from "@/lib/actions/dashboard/manufacturing/casting-job/saveCastingJobDraftSnapshotAction";
import { CastingJobDraftData } from "@/lib/actions/dashboard/manufacturing/casting-job/createDraftCastingJobAction";

export function useCastingJobDraftAutosave({
  getDraft,
  initialVersion,
  castingJobId,
  debounceMs = 1200,
  enabled = true,
}: {
  castingJobId: string;
  initialVersion: number;
  getDraft: () => CastingJobDraftData;
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
      const res = await saveCastingJobDraftSnapshotAction({
        castingJobId,
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
  }, [enabled, getDraft, castingJobId, version]);

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
