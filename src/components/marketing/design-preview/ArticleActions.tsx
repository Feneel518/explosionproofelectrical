"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import styles from "./blog.module.css";

export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const content = document.getElementById("article-body");
        if (!content || !bar.current) return;
        const rect = content.getBoundingClientRect();
        const distance = Math.max(1, rect.height - window.innerHeight + 88);
        bar.current.style.transform = `scaleX(${Math.min(1, Math.max(0, (88 - rect.top) / distance))})`;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  return <div ref={bar} className={styles.readingProgress} style={{ transform: "scaleX(0)" }} aria-hidden="true" />;
}

export function ArticleActions() {
  const [copied, setCopied] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const copy = async () => {
    const url = new URL(window.location.href);
    url.hash = "";
    try { await navigator.clipboard.writeText(url.href); setCopied(true); setManualUrl(""); }
    catch { setManualUrl(url.href); }
  };
  return <div className={styles.articleActions}><button type="button" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}Copy article link</button><span role="status">{copied ? "Link copied" : manualUrl ? "Select and copy the link below." : ""}</span>{manualUrl && <input aria-label="Article link to copy" readOnly value={manualUrl} onFocus={event => event.target.select()} />}</div>;
}
