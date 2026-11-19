"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ProductDiagram } from "@/components/site/ProductDiagram";
import { cadDrawings, type CadKind } from "@/components/site/cad-drawings";
import styles from "./library.module.css";

/** Key data from the technical-data block of each GA drawing. */
const specs: Record<CadKind, { name: string; rows: [string, string][] }> = {
  wellglass: { name: "LED well glass fitting, 45 W", rows: [["Protection", "IP-65"], ["Gas groups", "IIA, IIB & IIC"], ["Size", "265 × 315 mm"], ["Weight", "4.0 kg"]] },
  wellglass12: { name: "LED well glass fitting, 12 W", rows: [["Protection", "IP-65"], ["Gas groups", "IIA, IIB & IIC"], ["Size", "Ø220 × 165 mm"], ["Weight", "4.0 kg"]] },
  sunflower: { name: "LED high bay, sunflower type", rows: [["Protection", "IP-65"], ["Gas groups", "IIA, IIB & IIC"], ["Size", "Ø255 × 183 mm"], ["Weight", "5.5 kg"]] },
  bulkhead: { name: "Bottom-openable LED bulkhead, 2 × 30 W", rows: [["Protection", "IP-65"], ["Gas groups", "IIA, IIB & IIC"], ["Plate / cut-out", "610 × 610 / 410 × 290 mm"], ["Weight", "8.5 kg"]] },
  panel: { name: "Panel box with meters and controls", rows: [["Protection", "IP-65"], ["Gas groups", "IIA & IIB"], ["Size", "300 × 300 mm"], ["Weight", "18 kg"]] },
  switchsocket: { name: "Switch socket with plug", rows: [["Protection", "IP-65"], ["Gas groups", "IIA & IIB"], ["Rating", "Up to 32 A"], ["Weight", "2.25 kg"]] },
  rotaryswitch: { name: "Rotary switch, ON / OFF", rows: [["Protection", "IP-66"], ["Gas groups", "I, IIA & IIB"], ["Rating", "16 A, 230 V AC"], ["Weight", "2.25 kg"]] },
  junctionbox: { name: "Junction box, 4-way", rows: [["Protection", "IP-67"], ["Gas groups", "IIA & IIB"], ["Rating", "30 A, 415 V"], ["Weight", "1.0 kg"]] },
};
const order: CadKind[] = ["wellglass", "wellglass12", "sunflower", "bulkhead", "panel", "junctionbox", "rotaryswitch", "switchsocket"];

export function DrawingLibrary() {
  const [active, setActive] = useState<CadKind>("wellglass");
  const stageRef = useRef<HTMLDivElement>(null);
  const choose = (kind: CadKind) => {
    setActive(kind);
    // On narrow screens the viewer sits above the list: bring it back into view.
    const top = stageRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const spec = specs[active];
  return <div className={styles.library}>
    <div className={styles.stage} ref={stageRef}>
      <div className={styles.stageTop}><span>GA drawing</span><span>{cadDrawings[active].type}</span></div>
      <AnimatePresence mode="wait">
        <motion.div key={active} className={styles.drawing} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <ProductDiagram kind={active} play speed={0.8} title={spec.name} />
        </motion.div>
      </AnimatePresence>
      <dl className={styles.specs}>
        <div className={styles.specName}><dt>Product</dt><dd>{spec.name}</dd></div>
        {spec.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </div>
    <div className={styles.list} role="tablist" aria-label="GA drawings">
      {order.map((kind, i) => (
        <button key={kind} type="button" role="tab" aria-selected={active === kind} className={styles.item} data-active={active === kind || undefined} onClick={() => choose(kind)}>
          <span className={styles.thumb}><ProductDiagram kind={kind} labels={false} speed={0.5} title={specs[kind].name} /></span>
          <span className={styles.itemText}><span className={styles.itemIndex}>{String(i + 1).padStart(2, "0")} / {cadDrawings[kind].type}</span><span className={styles.itemName}>{specs[kind].name}</span></span>
        </button>
      ))}
    </div>
  </div>;
}
