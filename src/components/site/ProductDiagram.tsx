"use client";

import { createContext, useContext, useRef, type ReactNode, type SVGProps, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cadDrawings, type CadKind } from "./cad-drawings";

/**
 * Animated technical line drawings of the ExEC flameproof range.
 *
 * Every drawing lives in a 400 × 400 box and is built from strokes that draw
 * themselves in order (`o`). Shapes are listed back to front; solid parts (`f`)
 * are filled with the backdrop colour (`--diagram-bg`) so they hide what is
 * behind them, giving clean hidden-line drawings.
 *
 * Products that have an ExEC general-arrangement (GA) drawing are rendered from
 * that drawing's own line work (see `cad-drawings.ts`), with the overall sizes
 * in millimetres taken from it. The remaining drawings are traced from product
 * photographs and use letters (A, B…) for dimensions.
 */

export type DiagramKind = "wellglass" | "wellglass12" | "sunflower" | "bulkhead" | "floodlight" | "streetlight" | "pushbutton" | "rotaryswitch" | "switchsocket" | "gland" | "junctionbox" | "panel" | "tubelight" | "enclosure";

export const diagramTitles: Record<DiagramKind, string> = {
  wellglass: "Flameproof LED well glass fitting, 45 W",
  wellglass12: "Flameproof LED well glass fitting, 12 W",
  sunflower: "Flameproof LED high bay, sunflower type",
  bulkhead: "Flameproof bottom-openable LED bulkhead",
  floodlight: "Flameproof flood light fitting",
  streetlight: "Flameproof LED street light fitting",
  pushbutton: "Flameproof start / stop push button station",
  rotaryswitch: "Flameproof ON / OFF rotary switch",
  switchsocket: "Flameproof switch socket unit",
  gland: "Flameproof cable gland",
  junctionbox: "Flameproof junction box",
  panel: "Flameproof panel box",
  tubelight: "Flameproof twin tube light fitting",
  enclosure: "Flameproof enclosure",
};

/** Picks the drawing that best represents a product. */
export function diagramFor(name: string, category = ""): DiagramKind {
  const text = `${name} ${category}`.toLowerCase();
  if (/gland/.test(text)) return "gland";
  if (/push\s*-?\s*button|start\s*\/?\s*stop|control station/.test(text)) return "pushbutton";
  if (/rotary|on\s*\/?\s*off|isolator/.test(text)) return "rotaryswitch";
  if (/street/.test(text)) return "streetlight";
  if (/socket|plug/.test(text)) return "switchsocket";
  if (/sunflower|high\s*-?\s*bay/.test(text)) return "sunflower";
  if (/bulk\s*-?\s*head|false\s*ceiling|recessed|clean\s*room/.test(text)) return "bulkhead";
  if (/well\s*-?\s*glass/.test(text)) return /\b12\s*w\b/.test(text) ? "wellglass12" : "wellglass";
  if (/tube|fluorescent|linear/.test(text)) return "tubelight";
  if (/flood/.test(text)) return "floodlight";
  if (/junction|jb\b/.test(text)) return "junctionbox";
  if (/panel|distribution|feeder|db\b/.test(text)) return "panel";
  if (/light|lamp|fitting/.test(text)) return "wellglass";
  return "enclosure";
}

type Ctx = { shown: boolean; reduce: boolean; labels: boolean; speed: number };
const DiagramContext = createContext<Ctx>({ shown: true, reduce: false, labels: true, speed: 1 });
const EASE = [0.65, 0, 0.35, 1] as const;

type StrokeKind = "main" | "detail" | "fine" | "dim" | "accent" | "cad" | "cadfine";
type ShapeTag = "path" | "circle" | "rect" | "line" | "ellipse" | "polyline";
const shapes = { path: motion.path, circle: motion.circle, rect: motion.rect, line: motion.line, ellipse: motion.ellipse, polyline: motion.polyline };

type StrokeProps = { as?: ShapeTag; o?: number; k?: StrokeKind; /** Solid: filled with the backdrop colour so it hides lines behind it. */ f?: boolean } & Omit<SVGProps<SVGElement>, "ref" | "as">;

/** A single self-drawing stroke. */
function S({ as = "path", o = 0, k = "main", f = false, ...rest }: StrokeProps) {
  const { shown, reduce, speed } = useContext(DiagramContext);
  const Shape = shapes[as] as unknown as React.ComponentType<Record<string, unknown>>;
  const duration = (k === "cad" ? 2.4 : k === "cadfine" ? 2 : k === "main" || k === "accent" ? 1.25 : k === "dim" ? 0.7 : 0.85) * speed;
  const delay = o * 0.075 * speed;
  return <Shape {...rest} className={f ? `d-${k} d-bg` : `d-${k}`}
    initial={reduce ? false : { pathLength: 0, opacity: 0 }}
    animate={shown || reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
    transition={{ pathLength: { duration, delay, ease: EASE }, opacity: { duration: 0.2, delay } }} />;
}

/** Dash-dot centre line; fades rather than draws (dashes and path length can't share). */
function Axis({ d, o = 0 }: { d: string; o?: number }) {
  const { shown, reduce, speed } = useContext(DiagramContext);
  return <motion.path d={d} className="d-axis" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: shown || reduce ? 0.55 : 0 }} transition={{ duration: 0.8, delay: o * 0.075 * speed }} />;
}

function T({ x, y, children, o = 0, anchor = "middle", className, size }: { x: number; y: number; children: ReactNode; o?: number; anchor?: "start" | "middle" | "end"; className?: string; size?: number }) {
  const { shown, reduce, labels, speed } = useContext(DiagramContext);
  if (!labels) return null;
  return <motion.text x={x} y={y} textAnchor={anchor} className={className} style={size ? { fontSize: size } : undefined} initial={reduce ? false : { opacity: 0, y: 4 }} animate={shown || reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }} transition={{ duration: 0.5, delay: o * 0.075 * speed + 0.25 }}>{children}</motion.text>;
}

/** Straight dimension line with extension ticks and arrowheads. */
function Dim({ x1, y1, x2, y2, label, o = 0 }: { x1: number; y1: number; x2: number; y2: number; label: string; o?: number }) {
  const { labels } = useContext(DiagramContext);
  if (!labels) return null;
  const horizontal = y1 === y2;
  const a = 5, t = 7;
  const ticks = horizontal
    ? `M${x1} ${y1 - t} L${x1} ${y1 + t} M${x2} ${y2 - t} L${x2} ${y2 + t}`
    : `M${x1 - t} ${y1} L${x1 + t} ${y1} M${x2 - t} ${y2} L${x2 + t} ${y2}`;
  const heads = horizontal
    ? `M${x1 + a} ${y1 - a * 0.6} L${x1} ${y1} L${x1 + a} ${y1 + a * 0.6} M${x2 - a} ${y2 - a * 0.6} L${x2} ${y2} L${x2 - a} ${y2 + a * 0.6}`
    : `M${x1 - a * 0.6} ${y1 + a} L${x1} ${y1} L${x1 + a * 0.6} ${y1 + a} M${x2 - a * 0.6} ${y2 - a} L${x2} ${y2} L${x2 + a * 0.6} ${y2 - a}`;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return <g>
    <S k="dim" o={o} d={`M${x1} ${y1} L${x2} ${y2}`} />
    <S k="dim" o={o + 1} d={ticks} />
    <S k="dim" o={o + 2} d={heads} />
    {horizontal
      ? <T x={mx} y={my - 7} o={o + 3} className="d-dim-text">{label}</T>
      : <g transform={`rotate(-90 ${mx - 8} ${my})`}><T x={mx - 8} y={my + 3} o={o + 3} className="d-dim-text">{label}</T></g>}
  </g>;
}

/** Leader line from a point on the part to a labelled tag. */
function Callout({ x, y, lx, ly, label, n, o = 0 }: { x: number; y: number; lx: number; ly: number; label: string; n: number; o?: number }) {
  const { shown, reduce, labels, speed } = useContext(DiagramContext);
  if (!labels) return null;
  const right = lx > x;
  const end = right ? lx + 12 : lx - 12;
  return <g>
    <motion.circle cx={x} cy={y} r={2.6} className="d-accent-fill" initial={reduce ? false : { scale: 0 }} animate={{ scale: shown || reduce ? 1 : 0 }} transition={{ duration: 0.4, delay: o * 0.075 * speed }} style={{ transformOrigin: `${x}px ${y}px` }} />
    <S k="dim" o={o} d={`M${x} ${y} L${lx} ${ly} L${end} ${ly}`} />
    <T x={right ? end + 4 : end - 4} y={ly + 3} o={o + 2} anchor={right ? "start" : "end"} className="d-callout-text">{`${String(n).padStart(2, "0")} ${label}`}</T>
  </g>;
}

/* ------------------------------------------------------------------ */
/* Drawings                                                             */
/* ------------------------------------------------------------------ */

function Gland() {
  const threads = Array.from({ length: 8 }, (_, i) => 290 + i * 8);
  return <g>
    <Axis d="M18 200 L382 200" />
    {/* cable */}
    <S d="M28 182 L104 182 M28 218 L104 218" o={1} />
    <S d="M28 182 C20 192 36 208 28 218" k="detail" o={2} />
    <S d="M40 190 L104 190 M40 210 L104 210" k="fine" o={3} />
    {/* back nut */}
    <S as="rect" x={104} y={156} width={58} height={88} rx={4} o={2} />
    <S d="M104 178 L162 178 M104 222 L162 222" k="detail" o={4} />
    {/* armour clamp cone */}
    <S d="M162 168 L178 160 L178 240 L162 232" k="detail" o={5} />
    {/* body hex */}
    <S as="rect" x={178} y={140} width={80} height={120} rx={4} o={3} />
    <S d="M178 168 L258 168 M178 232 L258 232" k="detail" o={6} />
    {/* locknut + entry thread */}
    <S as="rect" x={258} y={168} width={92} height={64} o={5} />
    <S as="rect" x={264} y={150} width={18} height={100} rx={3} k="detail" o={7} />
    {threads.map((x, i) => <S key={x} d={`M${x} 168 L${x + 5} 232`} k="fine" o={8 + i * 0.25} />)}
    <S d="M350 168 L356 174 L356 226 L350 232" o={8} />
    <Dim x1={104} y1={300} x2={356} y2={300} label="L" o={12} />
    <Dim x1={374} y1={168} x2={374} y2={232} label="ET" o={13} />
    <Callout x={60} y={182} lx={46} ly={120} n={1} label="CABLE" o={14} />
    <Callout x={133} y={244} lx={110} ly={340} n={2} label="BACK NUT" o={15} />
    <Callout x={218} y={140} lx={200} ly={92} n={3} label="BODY" o={16} />
    <Callout x={273} y={150} lx={290} ly={112} n={4} label="LOCKNUT" o={17} />
    <Callout x={320} y={232} lx={300} ly={340} n={5} label="ENTRY THREAD" o={18} />
  </g>;
}

function Enclosure() {
  return <g>
    <Axis d="M200 30 L200 370" />
    <S as="rect" x={100} y={70} width={200} height={240} rx={14} o={1} />
    <S as="rect" x={114} y={84} width={172} height={212} rx={8} k="detail" o={3} />
    {[[122, 92], [278, 92], [122, 288], [278, 288]].map(([cx, cy], i) => <S key={i} as="circle" cx={cx} cy={cy} r={3.4} k="detail" o={5 + i * 0.3} />)}
    <S as="rect" x={186} y={310} width={28} height={22} rx={2} o={6} />
    <Dim x1={100} y1={364} x2={300} y2={364} label="A" o={9} />
    <Dim x1={330} y1={70} x2={330} y2={310} label="B" o={10} />
    <Callout x={140} y={150} lx={80} ly={130} n={1} label="BODY" o={11} />
    <Callout x={200} y={332} lx={130} ly={350} n={2} label="ENTRY" o={12} />
  </g>;
}

/* The drawings below are traced from ExEC product photographs: front elevations for the rotary
 * switch, push button and tube light; three-quarter views (as photographed) for the rest. */
function PushButton() {
  return <g>
    <Axis d="M208 22 L208 384" o={0} />
    <S as="rect" x={158} y={150} width={116} height={96} rx={4} f k="detail" o={1} />
    <S as="rect" x={166} y={188} width={22} height={8} rx={4} k="fine" o={7} />
    <S as="rect" x={244} y={188} width={22} height={8} rx={4} k="fine" o={7} />
    <S as="rect" x={146} y={336} width={24} height={14} rx={3} f k="detail" o={6} />
    <S as="rect" x={246} y={336} width={24} height={14} rx={3} f k="detail" o={6} />
    <S as="circle" cx={156} cy={343} r={3.5} k="fine" o={7} />
    <S as="circle" cx={260} cy={343} r={3.5} k="fine" o={7} />
    <S as="rect" x={166} y={312} width={84} height={34} rx={5} f o={5} />
    <S as="rect" x={173} y={340} width={24} height={20} rx={3} f o={7} />
    <S as="rect" x={219} y={340} width={24} height={20} rx={3} f o={7} />
    <S as="rect" x={112} y={100} width={34} height={24} rx={12} f o={3} />
    <S as="rect" x={270} y={100} width={34} height={24} rx={12} f o={3} />
    <S as="rect" x={112} y={256} width={34} height={24} rx={12} f o={3} />
    <S as="rect" x={270} y={256} width={34} height={24} rx={12} f o={3} />
    <S as="circle" cx={208} cy={112} r={66} f o={1} />
    <S as="circle" cx={208} cy={112} r={58} k="detail" o={3} />
    <S as="circle" cx={208} cy={268} r={66} f o={2} />
    <S as="circle" cx={208} cy={268} r={58} k="detail" o={4} />
    <S as="circle" cx={124} cy={112} r={6} f k="detail" o={6} />
    <S as="circle" cx={124} cy={112} r={2.6} k="fine" o={6.3} />
    <S as="circle" cx={292} cy={112} r={6} f k="detail" o={6} />
    <S as="circle" cx={292} cy={112} r={2.6} k="fine" o={6.3} />
    <S as="circle" cx={124} cy={268} r={6} f k="detail" o={6} />
    <S as="circle" cx={124} cy={268} r={2.6} k="fine" o={6.3} />
    <S as="circle" cx={292} cy={268} r={6} f k="detail" o={6} />
    <S as="circle" cx={292} cy={268} r={2.6} k="fine" o={6.3} />
    <S as="ellipse" cx={208} cy={69} rx={9} ry={5} k="fine" o={8} />
    <S as="ellipse" cx={208} cy={225} rx={9} ry={5} k="fine" o={8} />
    <S d="M193 120 L203 131 Q205 134 202 136 L199 137 Q197 137 196 135 L187 125" f k="detail" o={9} />
    <S as="circle" cx={176} cy={108} r={27} f k="detail" o={6} />
    <S as="circle" cx={176} cy={108} r={22} f k="accent" o={7} />
    <S as="circle" cx={176} cy={108} r={13} k="accent" o={9} />
    <S as="circle" cx={236} cy={110} r={18} f o={6} />
    <S as="circle" cx={236} cy={110} r={12} k="detail" o={8} />
    <S d="M232 106 L239 115" k="fine" o={9} />
    <T x={176} y={154} o={10} size={8}>STOP</T>
    <T x={236} y={154} o={10} size={8}>START</T>
    <S d="M168 245 L248 245 M160 255 L256 255" k="fine" o={10} />
    <S d="M162 268 L190 268" k="fine" o={10.3} />
    <S as="rect" x={198} y={262} width={50} height={9} rx={1} k="fine" o={10.4} />
    <S d="M162 279 L190 279" k="fine" o={10.5} />
    <S as="rect" x={198} y={273} width={50} height={9} rx={1} k="fine" o={10.6} />
    <S d="M162 290 L190 290" k="fine" o={10.7} />
    <S as="rect" x={198} y={284} width={50} height={9} rx={1} k="fine" o={10.8} />
    <T x={223} y={271} o={11} size={6}>EP-73102</T>
    <S d="M158 300 L258 300 M166 310 L250 310 M174 319 L242 319" k="fine" o={11.2} />
    <Dim x1={112} y1={386} x2={304} y2={386} label="A" o={14} />
    <Dim x1={330} y1={46} x2={330} y2={360} label="B" o={15} />
    <Callout x={160} y={96} lx={96} ly={62} n={1} label="STOP" o={16} />
    <Callout x={248} y={98} lx={262} ly={30} n={2} label="START" o={17} />
    <Callout x={124} y={112} lx={90} ly={150} n={3} label="LUG" o={18} />
    <Callout x={176} y={268} lx={96} ly={300} n={4} label="NAMEPLATE" o={19} />
    <Callout x={185} y={360} lx={96} ly={368} n={5} label="ENTRY" o={20} />
  </g>;
}

function Floodlight() {
  return <g>
    <S d="M262 258 L356 296 L349 314 L254 280 Z" f o={9} />
    <S d="M230 104 L256 108 Q300 118 312 168 L314 228 Q306 282 278 302 L230 302 Z" f o={1} />
    <S d="M268 132 Q296 144 303 182 L304 226 Q298 264 278 284" k="detail" o={3} />
    <S as="rect" x={305} y={176} width={20} height={22} rx={4} f k="detail" o={5} />
    <S as="ellipse" cx={325} cy={187} rx={4} ry={8} k="fine" o={6} />
    <S as="circle" cx={286} cy={128} r={5} f k="detail" o={6} />
    <S as="circle" cx={286} cy={128} r={2} k="fine" o={6.5} />
    <S as="ellipse" cx={171} cy={197} rx={104} ry={165} f o={2} />
    <S as="ellipse" cx={171} cy={197} rx={96} ry={157} o={3} />
    <S d="M214 196 Q242.8 204.3 264.1 228" k="detail" o={5} />
    <S d="M213.8 201.9 Q241.9 216 261.5 244.6" k="fine" o={6} />
    <S d="M212.4 213.7 Q239.2 232.2 256.9 263.7" k="detail" o={5.1} />
    <S d="M211.2 219.4 Q236.5 243.2 251.9 278.8" k="fine" o={6.1} />
    <S d="M207.8 230.4 Q231.4 258 244.7 295.5" k="detail" o={5.2} />
    <S d="M205.7 235.5 Q226.9 267.7 237.6 308.2" k="fine" o={6.2} />
    <S d="M200.4 245.1 Q219.6 280.2 228.2 321.6" k="detail" o={5.4} />
    <S d="M197.4 249.3 Q213.8 288.1 219.5 331.1" k="fine" o={6.4} />
    <S d="M190.7 256.9 Q204.7 297.6 208.4 340.4" k="detail" o={5.5} />
    <S d="M187 260.1 Q197.8 303.1 198.5 346.3" k="fine" o={6.5} />
    <S d="M179.1 265.2 Q187.5 309 186.4 350.9" k="detail" o={5.6} />
    <S d="M175.1 267.1 Q179.9 311.8 176 352.8" k="fine" o={6.6} />
    <S d="M166.5 269.5 Q169 313.8 163.5 352.5" k="detail" o={5.7} />
    <S d="M162.2 269.9 Q161.2 313.9 153.1 350.2" k="fine" o={6.7} />
    <S d="M153.5 269.5 Q150.2 311.9 141 345" k="detail" o={5.8} />
    <S d="M149.2 268.5 Q142.6 309 131.3 338.7" k="fine" o={6.8} />
    <S d="M140.9 265.2 Q132.3 303.1 120.3 329" k="detail" o={6} />
    <S d="M136.9 262.9 Q125.4 297.7 111.8 319" k="fine" o={7} />
    <S d="M129.3 256.9 Q116.3 288.2 102.6 305.2" k="detail" o={6.1} />
    <S d="M125.9 253.3 Q110.5 280.4 95.8 292.2" k="fine" o={7.1} />
    <S d="M119.6 245.1 Q103.1 267.9 88.8 275.2" k="detail" o={6.2} />
    <S d="M116.8 240.5 Q98.7 258.2 84.1 259.9" k="fine" o={7.2} />
    <S d="M112.2 230.4 Q93.6 243.4 79.8 240.6" k="detail" o={6.3} />
    <S d="M110.3 225 Q90.8 232.4 77.4 223.9" k="fine" o={7.3} />
    <S d="M107.6 213.7 Q88.1 216.2 76.1 203.5" k="detail" o={6.4} />
    <S d="M106.7 207.9 Q87.2 204.4 76.2 186.3" k="fine" o={7.4} />
    <S d="M106 196 Q87.2 187.7 77.9 166" k="detail" o={6.6} />
    <S d="M106.2 190.1 Q88.1 176 80.5 149.4" k="fine" o={7.6} />
    <S d="M107.6 178.3 Q90.8 159.8 85.1 130.3" k="detail" o={6.7} />
    <S d="M108.8 172.6 Q93.5 148.8 90.1 115.2" k="fine" o={7.7} />
    <S d="M112.2 161.6 Q98.6 134 97.3 98.5" k="detail" o={6.8} />
    <S d="M114.3 156.5 Q103.1 124.3 104.4 85.8" k="fine" o={7.8} />
    <S d="M119.6 146.9 Q110.4 111.8 113.8 72.4" k="detail" o={6.9} />
    <S d="M122.6 142.7 Q116.2 103.9 122.5 62.9" k="fine" o={7.9} />
    <S d="M129.3 135.1 Q125.3 94.4 133.6 53.6" k="detail" o={7} />
    <S d="M133 131.9 Q132.2 88.9 143.5 47.7" k="fine" o={8} />
    <S d="M140.9 126.8 Q142.5 83 155.6 43.1" k="detail" o={7.2} />
    <S d="M144.9 124.9 Q150.1 80.2 166 41.2" k="fine" o={8.2} />
    <S d="M153.5 122.5 Q161 78.2 178.5 41.5" k="detail" o={7.3} />
    <S d="M157.8 122.1 Q168.8 78.1 188.9 43.8" k="fine" o={8.3} />
    <S d="M166.5 122.5 Q179.8 80.1 201 49" k="detail" o={7.4} />
    <S d="M170.8 123.5 Q187.4 83 210.7 55.3" k="fine" o={8.4} />
    <S d="M179.1 126.8 Q197.7 88.9 221.7 65" k="detail" o={7.5} />
    <S d="M183.1 129.1 Q204.6 94.3 230.2 75" k="fine" o={8.5} />
    <S d="M190.7 135.1 Q213.7 103.8 239.4 88.8" k="detail" o={7.6} />
    <S d="M194.1 138.7 Q219.5 111.6 246.2 101.8" k="fine" o={8.6} />
    <S d="M200.4 146.9 Q226.9 124.1 253.2 118.8" k="detail" o={7.8} />
    <S d="M203.2 151.5 Q231.3 133.8 257.9 134.1" k="fine" o={8.8} />
    <S d="M207.8 161.6 Q236.4 148.6 262.2 153.4" k="detail" o={7.9} />
    <S d="M209.7 167 Q239.2 159.6 264.6 170.1" k="fine" o={8.9} />
    <S d="M212.4 178.3 Q241.9 175.8 265.9 190.5" k="detail" o={8} />
    <S d="M213.3 184.1 Q242.8 187.6 265.8 207.7" k="fine" o={9} />
    <S as="ellipse" cx={160} cy={196} rx={54} ry={74} f o={4} />
    <S as="ellipse" cx={158} cy={196} rx={44} ry={62} k="detail" o={6} />
    <S as="circle" cx={193.6} cy={244.1} r={3.4} f k="detail" o={8} />
    <S as="circle" cx={124.4} cy={244.1} r={3.4} f k="detail" o={8} />
    <S as="circle" cx={124.4} cy={147.9} r={3.4} f k="detail" o={8} />
    <S as="circle" cx={193.6} cy={147.9} r={3.4} f k="detail" o={8} />
    <S as="ellipse" cx={152} cy={196} rx={33} ry={47} f o={7} />
    <S as="ellipse" cx={152} cy={196} rx={26} ry={39} k="fine" o={9} />
    <S d="M136 170 Q152 162 168 170 M134 222 Q152 232 168 222" k="fine" o={10} />
    <S as="circle" cx={283} cy={276} r={9} f o={10} />
    <S as="circle" cx={283} cy={276} r={4} k="detail" o={11} />
    <Dim x1={36} y1={32} x2={36} y2={362} label="A" o={14} />
    <Dim x1={67} y1={386} x2={318} y2={386} label="B" o={15} />
    <Callout x={232} y={62} lx={262} ly={26} n={1} label="GUARD RING" o={16} />
    <Callout x={226} y={130} lx={300} ly={72} n={2} label="FINS" o={17} />
    <Callout x={136} y={226} lx={60} ly={352} n={3} label="GLASS" o={18} />
    <Callout x={325} y={187} lx={346} ly={150} n={4} label="ENTRY" o={19} />
    <Callout x={330} y={300} lx={300} ly={350} n={5} label="BRACKET" o={20} />
  </g>;
}

function StreetLight() {
  return <g>
    <S d="M262 206 L302 262 L293 277 L252 228 Z" f o={9} />
    <S d="M292 56 L301 64 L247 370 L238 372 Z" f o={3} />
    <S d="M110 27 L292 56 L238 372 L106 348 Z" f o={1} />
    <S d="M114 34 L285 62 L233 364 L111 341 Z" k="detail" o={2} />
    <S d="M124.3 35.7 L126 51.6" k="fine" o={8} />
    <S d="M140.5 38.3 L141.9 54.2" k="fine" o={8.1} />
    <S d="M156.8 41 L157.8 56.8" k="fine" o={8.2} />
    <S d="M173 43.7 L173.6 59.3" k="fine" o={8.3} />
    <S d="M189.2 46.3 L189.5 61.9" k="fine" o={8.4} />
    <S d="M205.5 49 L205.3 64.4" k="fine" o={8.5} />
    <S d="M221.7 51.6 L221.2 67" k="fine" o={8.6} />
    <S d="M238 54.3 L237.1 69.6" k="fine" o={8.7} />
    <S d="M254.2 57 L252.9 72.1" k="fine" o={8.8} />
    <S d="M270.5 59.6 L268.8 74.7" k="fine" o={8.9} />
    <S d="M279.8 92.2 L255.8 88.2" k="fine" o={8.5} />
    <S d="M276.8 109.7 L252.8 105.7" k="fine" o={8.6} />
    <S d="M273.8 127.2 L249.8 123.2" k="fine" o={8.6} />
    <S d="M270.8 144.7 L246.8 140.7" k="fine" o={8.7} />
    <S d="M267.7 162.3 L243.7 158.3" k="fine" o={8.8} />
    <S d="M264.7 179.8 L240.7 175.8" k="fine" o={8.8} />
    <S d="M261.7 197.3 L237.7 193.3" k="fine" o={8.9} />
    <S d="M258.7 214.8 L234.7 210.8" k="fine" o={9} />
    <S d="M255.7 232.3 L231.7 228.3" k="fine" o={9.1} />
    <S d="M252.7 249.8 L222.7 244.8" k="fine" o={9.1} />
    <S d="M249.6 267.4 L219.6 262.4" k="fine" o={9.2} />
    <S d="M246.6 284.9 L216.6 279.9" k="fine" o={9.3} />
    <S d="M243.6 302.4 L213.6 297.4" k="fine" o={9.3} />
    <S d="M240.6 319.9 L210.6 314.9" k="fine" o={9.4} />
    <S d="M237.6 337.4 L207.6 332.4" k="fine" o={9.5} />
    <S d="M111 188.1 L116 190.1" k="fine" o={9} />
    <S d="M111 209 L116 211" k="fine" o={9.1} />
    <S d="M111 229.9 L116 231.9" k="fine" o={9.2} />
    <S d="M111 250.8 L116 252.8" k="fine" o={9.2} />
    <S d="M111 271.8 L116 273.8" k="fine" o={9.3} />
    <S d="M111 292.7 L116 294.7" k="fine" o={9.4} />
    <S d="M111 313.6 L116 315.6" k="fine" o={9.5} />
    <S d="M111 334.6 L116 336.6" k="fine" o={9.6} />
    <S d="M108 196 L224 246 L214 350 L110 318 Z" f k="detail" o={6} />
    <S d="M113 60 L241 88 L229 231 L111 173 Z" f o={4} />
    <S d="M118 67 L233 94 L221 222 L117 164 Z" k="detail" o={5} />
    <S d="M124 75 L226 99 L216 214 L123 157 Z" k="fine" o={6} />
    <S as="rect" x={133.9} y={91.4} width={4} height={4} rx={0.5} k="fine" o={7} />
    <S as="rect" x={151.9} y={96.7} width={4} height={4} rx={0.5} k="fine" o={7.1} />
    <S as="rect" x={170} y={102.1} width={4} height={4} rx={0.5} k="fine" o={7.2} />
    <S as="rect" x={188.1} y={107.5} width={4} height={4} rx={0.5} k="fine" o={7.2} />
    <S as="rect" x={206.1} y={112.9} width={4} height={4} rx={0.5} k="fine" o={7.3} />
    <S as="rect" x={133.3} y={114.6} width={4} height={4} rx={0.5} k="fine" o={7.4} />
    <S as="rect" x={150.9} y={121.6} width={4} height={4} rx={0.5} k="fine" o={7.5} />
    <S as="rect" x={168.6} y={128.5} width={4} height={4} rx={0.5} k="fine" o={7.6} />
    <S as="rect" x={186.2} y={135.5} width={4} height={4} rx={0.5} k="fine" o={7.6} />
    <S as="rect" x={203.8} y={142.5} width={4} height={4} rx={0.5} k="fine" o={7.7} />
    <S as="rect" x={132.7} y={137.8} width={4} height={4} rx={0.5} k="fine" o={7.8} />
    <S as="rect" x={149.9} y={146.4} width={4} height={4} rx={0.5} k="fine" o={7.9} />
    <S as="rect" x={167.1} y={155} width={4} height={4} rx={0.5} k="fine" o={8} />
    <S as="rect" x={184.3} y={163.6} width={4} height={4} rx={0.5} k="fine" o={8} />
    <S as="rect" x={201.5} y={172.2} width={4} height={4} rx={0.5} k="fine" o={8.1} />
    <S as="circle" cx={129} cy={35} r={4.5} f k="detail" o={10} />
    <S as="circle" cx={129} cy={35} r={1.8} k="fine" o={10.5} />
    <S as="circle" cx={175} cy={45} r={4.5} f k="detail" o={10.1} />
    <S as="circle" cx={175} cy={45} r={1.8} k="fine" o={10.6} />
    <S as="circle" cx={240} cy={52} r={4.5} f k="detail" o={10.2} />
    <S as="circle" cx={240} cy={52} r={1.8} k="fine" o={10.7} />
    <S as="circle" cx={261} cy={117} r={4.5} f k="detail" o={10.3} />
    <S as="circle" cx={261} cy={117} r={1.8} k="fine" o={10.8} />
    <S as="circle" cx={238} cy={226} r={4.5} f k="detail" o={10.4} />
    <S as="circle" cx={238} cy={226} r={1.8} k="fine" o={10.9} />
    <S as="circle" cx={219} cy={326} r={4.5} f k="detail" o={10.5} />
    <S as="circle" cx={219} cy={326} r={1.8} k="fine" o={11} />
    <S as="circle" cx={189} cy={342} r={4.5} f k="detail" o={10.6} />
    <S as="circle" cx={189} cy={342} r={1.8} k="fine" o={11.1} />
    <S as="circle" cx={106} cy={146} r={4.5} f k="detail" o={10.7} />
    <S as="circle" cx={106} cy={146} r={1.8} k="fine" o={11.2} />
    <S as="circle" cx={100} cy={215} r={4.5} f k="detail" o={10.8} />
    <S as="circle" cx={100} cy={215} r={1.8} k="fine" o={11.3} />
    <S as="circle" cx={108} cy={256} r={4.5} f k="detail" o={10.9} />
    <S as="circle" cx={108} cy={256} r={1.8} k="fine" o={11.4} />
    <S as="circle" cx={145} cy={290} r={4.5} f k="detail" o={11} />
    <S as="circle" cx={145} cy={290} r={1.8} k="fine" o={11.5} />
    <S as="circle" cx={276} cy={226} r={6} f o={10} />
    <S as="circle" cx={276} cy={226} r={2.5} k="fine" o={11} />
    <Dim x1={326} y1={56} x2={326} y2={372} label="A" o={14} />
    <Dim x1={106} y1={390} x2={238} y2={390} label="B" o={15} />
    <Callout x={152.9} y={123.6} lx={84} ly={110} n={1} label="LED ARRAY" o={16} />
    <Callout x={119} y={150} lx={78} ly={180} n={2} label="GLASS" o={17} />
    <Callout x={100} y={215} lx={78} ly={252} n={3} label="BOLTS" o={18} />
    <Callout x={298} y={268} lx={312} ly={318} n={4} label="BRACKET" o={19} />
  </g>;
}

function Tubelight() {
  return <g>
    <Axis d="M200 8 L200 380" o={0} />
    <S as="rect" x={196} y={14} width={8} height={356} rx={2} f k="detail" o={1} />
    <S as="circle" cx={200} cy={21} r={2.5} k="fine" o={2} />
    <S as="circle" cx={200} cy={363} r={2.5} k="fine" o={2} />
    <S as="rect" x={158} y={330} width={8} height={14} rx={2} f k="detail" o={8} />
    <S as="rect" x={167} y={44} width={28} height={270} rx={3} f o={3} />
    <S d="M173 48 L173 310 M189 48 L189 310" k="detail" o={4} />
    <S d="M178 54 L178 304" k="fine" o={5} />
    <S d="M167 62 Q181 66 195 62" k="detail" o={5} />
    <S d="M167 80 Q181 84 195 80" k="detail" o={5.1} />
    <S d="M167 98 Q181 102 195 98" k="detail" o={5.2} />
    <S d="M167 116 Q181 120 195 116" k="detail" o={5.4} />
    <S d="M167 134 Q181 138 195 134" k="detail" o={5.5} />
    <S d="M167 152 Q181 156 195 152" k="detail" o={5.6} />
    <S d="M167 170 Q181 174 195 170" k="detail" o={5.7} />
    <S d="M167 188 Q181 192 195 188" k="detail" o={5.8} />
    <S d="M167 206 Q181 210 195 206" k="detail" o={6} />
    <S d="M167 224 Q181 228 195 224" k="detail" o={6.1} />
    <S d="M167 242 Q181 246 195 242" k="detail" o={6.2} />
    <S d="M167 260 Q181 264 195 260" k="detail" o={6.3} />
    <S d="M167 278 Q181 282 195 278" k="detail" o={6.4} />
    <S d="M167 296 Q181 300 195 296" k="detail" o={6.6} />
    <S as="rect" x={167} y={26} width={28} height={13} rx={4} f o={2} />
    <S as="rect" x={164} y={38} width={34} height={7} rx={2} f o={3} />
    <S as="rect" x={164} y={313} width={34} height={7} rx={2} f o={6} />
    <S as="rect" x={166} y={320} width={30} height={36} rx={6} f o={7} />
    <S d="M166 338 L196 338" k="fine" o={8} />
    <S as="rect" x={234} y={330} width={8} height={14} rx={2} f k="detail" o={8.5} />
    <S as="rect" x={205} y={44} width={28} height={270} rx={3} f o={3.5} />
    <S d="M211 48 L211 310 M227 48 L227 310" k="detail" o={4.5} />
    <S d="M216 54 L216 304" k="fine" o={5.5} />
    <S d="M205 62 Q219 66 233 62" k="detail" o={5.5} />
    <S d="M205 80 Q219 84 233 80" k="detail" o={5.6} />
    <S d="M205 98 Q219 102 233 98" k="detail" o={5.7} />
    <S d="M205 116 Q219 120 233 116" k="detail" o={5.9} />
    <S d="M205 134 Q219 138 233 134" k="detail" o={6} />
    <S d="M205 152 Q219 156 233 152" k="detail" o={6.1} />
    <S d="M205 170 Q219 174 233 170" k="detail" o={6.2} />
    <S d="M205 188 Q219 192 233 188" k="detail" o={6.3} />
    <S d="M205 206 Q219 210 233 206" k="detail" o={6.5} />
    <S d="M205 224 Q219 228 233 224" k="detail" o={6.6} />
    <S d="M205 242 Q219 246 233 242" k="detail" o={6.7} />
    <S d="M205 260 Q219 264 233 260" k="detail" o={6.8} />
    <S d="M205 278 Q219 282 233 278" k="detail" o={6.9} />
    <S d="M205 296 Q219 300 233 296" k="detail" o={7.1} />
    <S as="rect" x={205} y={26} width={28} height={13} rx={4} f o={2.5} />
    <S as="rect" x={202} y={38} width={34} height={7} rx={2} f o={3.5} />
    <S as="rect" x={202} y={313} width={34} height={7} rx={2} f o={6.5} />
    <S as="rect" x={204} y={320} width={30} height={36} rx={6} f o={7.5} />
    <S d="M204 338 L234 338" k="fine" o={8.5} />
    <Dim x1={262} y1={26} x2={262} y2={356} label="A" o={12} />
    <Dim x1={167} y1={390} x2={233} y2={390} label="B" o={13} />
    <Callout x={167} y={32} lx={110} ly={30} n={1} label="END CAP" o={14} />
    <Callout x={167} y={152} lx={104} ly={150} n={2} label="WIRE GUARD" o={15} />
    <Callout x={176} y={232} lx={104} ly={232} n={3} label="GLASS TUBE" o={16} />
    <Callout x={166} y={340} lx={104} ly={330} n={4} label="CHAMBER" o={17} />
    <Callout x={204} y={364} lx={292} ly={372} n={5} label="CHANNEL" o={18} />
  </g>;
}

/** A drawing taken from an ExEC GA drawing: line work, overall sizes and callouts. */
function Cad({ kind }: { kind: CadKind }) {
  const c = cadDrawings[kind];
  return <g>
    <S k="cad" d={c.d} />
    {c.fine && <S k="cadfine" o={4} d={c.fine} />}
    {c.dims.map(([x1, y1, x2, y2, label], i) => <Dim key={label + i} x1={x1} y1={y1} x2={x2} y2={y2} label={label} o={14 + i * 2} />)}
    {c.callouts.map(([x, y, lx, ly, label], i) => <Callout key={label} x={x} y={y} lx={lx} ly={ly} label={label} n={i + 1} o={18 + i} />)}
  </g>;
}
const cad = (kind: CadKind) => function CadDrawing() { return <Cad kind={kind} />; };

const drawings: Record<DiagramKind, () => ReactNode> = {
  wellglass: cad("wellglass"), wellglass12: cad("wellglass12"), sunflower: cad("sunflower"), bulkhead: cad("bulkhead"),
  rotaryswitch: cad("rotaryswitch"), switchsocket: cad("switchsocket"), junctionbox: cad("junctionbox"), panel: cad("panel"),
  floodlight: Floodlight, streetlight: StreetLight, pushbutton: PushButton, gland: Gland, tubelight: Tubelight, enclosure: Enclosure,
};

type DiagramProps = {
  kind: DiagramKind;
  className?: string;
  /** Force play state. When omitted the drawing plays once it scrolls into view. */
  play?: boolean;
  /** Show dimensions, callouts and labels. */
  labels?: boolean;
  /** Multiplier for timings (lower is faster). */
  speed?: number;
  title?: string;
};

export function ProductDiagram({ kind, className, play, labels = true, speed = 1, title }: DiagramProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  // Every drawing starts undrawn, so its line work is only added to the page when it is
  // about to be seen (or first played, for drawings revealed on hover). Keeps the HTML
  // small: the GA drawings alone are 10–20 KB of path data each.
  const near = useInView(ref, { once: true, margin: "400px 0px 400px 0px" });
  const [played, setPlayed] = useState(false);
  if (play && !played) setPlayed(true);
  const mounted = play === undefined ? near : played;
  const reduce = Boolean(useReducedMotion());
  const Drawing = drawings[kind];
  // Without labels a GA drawing is cropped to the part itself, so it fills its frame.
  const cadBox = !labels && kind in cadDrawings ? cadDrawings[kind as CadKind].box : null;
  const viewBox = cadBox ? `${cadBox[0] - 10} ${cadBox[1] - 10} ${cadBox[2] + 20} ${cadBox[3] + 20}` : "0 0 400 400";
  return <svg ref={ref} viewBox={viewBox} className={`exec-diagram ${className ?? ""}`} role="img" aria-label={`Line drawing: ${title ?? diagramTitles[kind]}`}>
    <DiagramContext.Provider value={{ shown: play ?? inView, reduce, labels, speed }}>
      {mounted && <Drawing />}
    </DiagramContext.Provider>
  </svg>;
}
