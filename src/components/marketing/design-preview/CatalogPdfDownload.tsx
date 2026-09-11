"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import styles from "./catalog.module.css";

export function CatalogPdfDownload() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const download = async () => {
    if (busy) return;
    setBusy(true);
    setStatus("Preparing the complete product catalog...");
    try {
      const response = await fetch("/api/catalog/pdf");
      if (!response.ok || !response.headers.get("content-type")?.includes("application/pdf")) throw new Error("Download failed");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "ExEC-Product-Catalog.pdf";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setStatus("Your PDF is ready. Check your downloads.");
    } catch {
      setStatus("The PDF could not be downloaded. Please try again.");
    } finally { setBusy(false); }
  };
  return <div className={styles.shareBlock}>
    <div className={styles.shareActions}><button type="button" onClick={download} disabled={busy} aria-busy={busy}>
      {busy ? <LoaderCircle size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
      {busy ? "Preparing PDF..." : "Download full catalog PDF"}
    </button></div>
    <span className={styles.shareStatus} role="status">{status}</span>
  </div>;
}
