"""Generate src/components/site/cad-drawings.ts from the ExEC GA drawings."""
import json, cad, w12, re
from views import VIEWS

FIT = (92, 40, 308, 346)
# Per drawing: source, type number, real dimensions (mm, as on the GA drawing) and callouts.
# Callout targets are fractions (u, v) of the drawing's bounding box.
META = {
  "wellglass":    dict(title="FLP/WP LED well glass fitting, 45 W", type="EXEC-L-63045",
                       w="265", h="315", h_from=(75 - 30) / 340,
                       callouts=[(.5, .044, "EYE BOLT"), (.893, .259, "ENTRY"), (.794, .4, "CANOPY"), (.518, .69, "GLASS"), (.728, .794, "GUARD")]),
  "sunflower":    dict(title="FLP/WP LED high bay (sunflower), 45 W", type="EXEC-L-63045",
                       w="Ø255", h="183", callouts=[(.70, .2, "BRACKET"), (.969, .487, "GEAR BOX"), (.74, .63, "HOUSING"), (.86, .87, "FINS")]),
  "bulkhead":     dict(title="FLP/WP bottom-openable LED bulkhead, 2 × 30 W", type="Ex-LED-63060",
                       w="610", h="610", callouts=[(.987, .045, "SS PLATE"), (.614, .185, "MOUNTING"), (.607, .442, "COB LED"), (.857, .6, "CUT-OUT")]),
  "panel":        dict(title="FLP/WP panel box", type="ECP-63525",
                       w="300", h="300", callouts=[(.58, .197, "LAMP"), (.657, .337, "METER"), (.367, .563, "PUSH"), (.977, .66, "LUG")]),
  "switchsocket": dict(title="FLP/WP switch socket with plug", type="EP-63111",
                       w="145", h="250", w_span=(0, (238 - 56) / 288), h_from=(48 - 40) / 320,
                       callouts=[(.64, .19, "CHAIN"), (.52, .25, "SOCKET"), (.95, .72, "PLUG"), (.465, .81, "NAMEPLATE"), (.465, .97, "ENTRY")]),
  "junctionbox":  dict(title="FLP/WP junction box, 4-way", type="EJB-63100",
                       callouts=[(.833, .162, "EARTH"), (.97, .435, "ENTRY"), (.45, .468, "TERMINALS"), (.868, .5, "LOCK"), (.78, .78, "COVER")]),
  "rotaryswitch": dict(title="FLP/WP rotary switch, ON / OFF", type="EP-73107",
                       w="145", h="250", callouts=[(.53, .234, "SELECTOR"), (.79, .469, "MOUNTING"), (.935, .71, "LUG"), (.745, .8, "NAMEPLATE"), (.77, .97, "ENTRY")]),
  "wellglass12":  dict(title="FLP/WP LED well glass fitting, 12 W", type="EXEC-WG-12W",
                       w="Ø220", h="165", w_span=((80 - 52) / 299, (343 - 52) / 299), h_from=(102 - 27) / 333,
                       callouts=[(.98, .22, "BRACKET"), (.81, .29, "COVER"), (.58, .53, "ENTRY"), (.896, .64, "FINS"), (.73, .82, "GLASS")]),
}

def refit_w12():
    """Re-run the hand trace with a scale/offset that fits FIT."""
    bx0, by0, bx1, by1 = 52, 27, 351, 360           # bbox at the trace's own scale
    k = min((FIT[2] - FIT[0]) / (bx1 - bx0), (FIT[3] - FIT[1]) / (by1 - by0))
    cx, cy = (FIT[0] + FIT[2]) / 2, (FIT[1] + FIT[3]) / 2
    w12.S *= k; w12.OX = cx - ((bx0 + bx1) / 2 - w12.OX) * k; w12.OY = cy - ((by0 + by1) / 2 - w12.OY) * k
    import importlib, sys
    src = open("w12.py").read().split('if __name__')[0]
    ns = {}; exec(src.replace("S, OX, OY = .42, 40, 22", f"S, OX, OY = {w12.S}, {w12.OX}, {w12.OY}"), ns)
    w, h = (bx1 - bx0) * k, (by1 - by0) * k
    return ns["paths"], (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)

out = {}
for kind, meta in META.items():
    if kind == "wellglass12":
        paths, box = refit_w12()
    else:
        v = dict(VIEWS[kind]); v["fit"] = FIT
        paths, (sc, ox, oy) = cad.normalise(v)
        ents = cad.select(v)
        bx0 = min(e["box"][0] for e in ents) * sc + ox; bx1 = max(e["box"][2] for e in ents) * sc + ox
        by0 = min(e["box"][1] for e in ents) * sc + oy; by1 = max(e["box"][3] for e in ents) * sc + oy
        box = (bx0, by0, bx1, by1)
    x0, y0, x1, y1 = box; W, H = x1 - x0, y1 - y0
    r = lambda v: round(v, 1)
    dims = []
    if meta.get("w"):
        a, b = meta.get("w_span", (0, 1))
        dims.append([r(x0 + a * W), r(y1 + 18), r(x0 + b * W), r(y1 + 18), f'{meta["w"]}'])
    if meta.get("h"):
        hy = y0 + meta.get("h_from", 0) * H
        dims.append([r(x0 - 18), r(hy), r(x0 - 18), r(y1), meta["h"]])
    cs = sorted(meta["callouts"], key=lambda c: c[1])
    rows, last = [], -1e9
    for u, v_, lab in cs:                      # level leaders, nudged apart where targets are close
        y = max(y0 + v_ * H, last + 17); rows.append(y); last = y
    callouts = [[r(x0 + u * W), r(y0 + v_ * H), r(x1 + 14), r(ry), lab] for (u, v_, lab), ry in zip(cs, rows)]
    out[kind] = dict(title=meta["title"], type=meta["type"], d=paths.get("cad", ""), fine=paths.get("cadfine", ""), dims=dims, callouts=callouts, box=[r(x0), r(y0), r(W), r(H)])

ts = ['/* Generated from the ExEC general-arrangement (GA) drawings by tools/cad. Do not edit by hand. */',
      'export type CadKind = ' + " | ".join(f'"{k}"' for k in out) + ';',
      'export type CadDrawing = { title: string; type: string; d: string; fine: string; dims: [number, number, number, number, string][]; callouts: [number, number, number, number, string][]; box: [number, number, number, number] };',
      'export const cadDrawings: Record<CadKind, CadDrawing> = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';', '']
open("/home/claude/explosionproofelectrical/src/components/site/cad-drawings.ts", "w").write("\n".join(ts))
print({k: (len(v["d"]) + len(v["fine"]), v["dims"], len(v["callouts"])) for k, v in out.items()})
