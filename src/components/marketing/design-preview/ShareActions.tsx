"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Printer, Share2 } from "lucide-react";
import styles from "./catalog.module.css";

export function ShareActions({ title, path, label = "Share", printable = false }: { title: string; path: string; label?: string; printable?: boolean }) {
  const [status, setStatus] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const getUrl = () => new URL(path, window.location.origin).href;
  const copy = async () => {
    try { await navigator.clipboard.writeText(getUrl()); setStatus("Link copied"); setManualUrl(""); }
    catch { setManualUrl(getUrl()); setStatus("Select and copy the link below."); }
  };
  const share = async () => {
    if (!navigator.share) return copy();
    try { await navigator.share({ title, text: title, url: getUrl() }); setStatus("Share options opened"); }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) await copy(); }
  };
  return <div className={styles.shareBlock}>
    <div className={styles.shareActions}>
      <button type="button" onClick={share}><Share2 size={16} />{label}</button>
      <button type="button" onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${getUrl()}`)}`, "_blank", "noopener,noreferrer"); }}><MessageCircle size={16} />WhatsApp</button>
      <button type="button" onClick={copy}>{status === "Link copied" ? <Check size={16} /> : <Copy size={16} />}Copy link</button>
      {printable && <button type="button" onClick={() => window.print()}><Printer size={16} />Print / PDF</button>}
    </div>
    <span className={styles.shareStatus} role="status">{status}</span>
    {manualUrl && <input aria-label="Link to copy" readOnly value={manualUrl} onFocus={(event) => event.target.select()} />}
  </div>;
}
