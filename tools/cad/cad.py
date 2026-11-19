"""Extract clean line work for one view of an AutoCAD-plotted PDF.

Each view is described in VIEWS: the crop box (page points, as rotated on screen),
boxes whose small entities (text, arrows, leaders) are removed, entity ids to drop
(centre lines, dimension lines), and colours to keep.
"""
import sys, glob, math, json, pymupdf

def entities(pdf):
    p = pymupdf.open(pdf)[0]; m = p.rotation_matrix
    out = []
    for d in p.get_drawings():
        col = d.get("color")
        if not col: continue
        segs = []
        for it in d["items"]:
            if it[0] == "l": segs.append(("l", [pymupdf.Point(it[1]) * m, pymupdf.Point(it[2]) * m]))
            elif it[0] == "c": segs.append(("c", [pymupdf.Point(q) * m for q in it[1:5]]))
            elif it[0] == "re":
                r = it[1]; q = [r.tl, r.tr, r.br, r.bl, r.tl]
                segs += [("l", [pymupdf.Point(q[i]) * m, pymupdf.Point(q[i + 1]) * m]) for i in range(4)]
            elif it[0] == "qu":
                u = it[1]; q = [u.ul, u.ur, u.lr, u.ll, u.ul]
                segs += [("l", [pymupdf.Point(q[i]) * m, pymupdf.Point(q[i + 1]) * m]) for i in range(4)]
        pts = [pt for _, s in segs for pt in s]
        if not pts: continue
        xs = [q.x for q in pts]; ys = [q.y for q in pts]
        out.append(dict(id=d["seqno"], col="#%02x%02x%02x" % tuple(int(v * 255) for v in col),
                        segs=segs, box=(min(xs), min(ys), max(xs), max(ys))))
    return out

def inside(b, r): return r[0] <= b[0] and b[2] <= r[2] and r[1] <= b[1] and b[3] <= r[3]
def cad_size(e): return size(e["box"])
def size(b): return max(b[2] - b[0], b[3] - b[1])

def circle_of(e):
    """(cx, cy, r) when the entity is a closed loop of points all the same distance from their centre."""
    pts = [q for _, s in e["segs"] for q in (s[0], s[-1])]
    if len(e["segs"]) < 4 or abs(pts[0].x - pts[-1].x) > .3 or abs(pts[0].y - pts[-1].y) > .3: return None
    b = e["box"]; cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
    if abs((b[2] - b[0]) - (b[3] - b[1])) > .04 * max(b[2] - b[0], .1): return None
    r = (b[2] - b[0]) / 2
    if r < .4 or any(abs(math.hypot(q.x - cx, q.y - cy) - r) > max(.03 * r, .08) for q in pts): return None
    # sweep must close: segment chords well spread around the circle
    return (cx, cy, r)

def centreline(e, centres):
    if len(e["segs"]) != 1 or e["segs"][0][0] != "l": return False
    a, b = e["segs"][0][1]
    if abs(a.y - b.y) < .05:
        y = a.y; lo, hi = sorted((a.x, b.x))
        return any(abs(cy - y) < .35 and lo - .5 < cx < hi + .5 and hi - lo > 1.6 * r for cx, cy, r in centres)
    if abs(a.x - b.x) < .05:
        x = a.x; lo, hi = sorted((a.y, b.y))
        return any(abs(cx - x) < .35 and lo - .5 < cy < hi + .5 and hi - lo > 1.6 * r for cx, cy, r in centres)
    return False

def select(view):
    pdf = glob.glob(f"/mnt/user-data/uploads/*{view['file']}")[0]
    keep = []
    ents = [e for e in entities(pdf) if inside(e["box"], view["crop"])]
    centres = [c for c in (circle_of(e) for e in ents) if c] + [tuple(c) for c in view.get("centres", ())]
    for e in ents:
        e["circle"] = circle_of(e)
        if len(e["segs"]) == 1 and size(e["box"]) < view.get("dot", .9): continue
        if view.get("auto_centre", True) and centreline(e, centres): continue
        if e["col"] not in view.get("colors", ["#000000"]): continue
        if e["id"] in view.get("drop", ()): continue
        bad = False
        for x0, y0, x1, y1, *lim in view.get("mask", ()):
            if inside(e["box"], (x0, y0, x1, y1)) and size(e["box"]) <= (lim[0] if lim else 1e9): bad = True; break
        if not bad: keep.append(e)
    return keep

def fmt(v):
    t = f"{v:.1f}"
    if t.endswith(".0"): t = t[:-2]
    if t.startswith("0."): t = t[1:]
    elif t.startswith("-0."): t = "-" + t[2:]
    return t or "0"

def compact(ents, f, sc):
    """Relative path data; circles become two arcs."""
    out = []; cur = None
    def nums(*vs):
        s = ""
        for v in vs:
            t = fmt(v); s += ("" if (not s or t.startswith("-")) else " ") + t
        return s
    for e in ents:
        if e.get("circle"):
            cx, cy, r = e["circle"]; x, y = f(pymupdf.Point(cx - r, cy)); rr = r * sc
            out.append(f"M{fmt(x)} {fmt(y)}a{fmt(rr)} {fmt(rr)} 0 1 0 {fmt(2*rr)} 0a{fmt(rr)} {fmt(rr)} 0 1 0 {fmt(-2*rr)} 0")
            cur = (x, y); continue
        for k, s_ in e["segs"]:
            a = f(s_[0])
            if cur is None or abs(a[0] - cur[0]) > .06 or abs(a[1] - cur[1]) > .06:
                out.append(f"M{fmt(a[0])} {fmt(a[1])}"); cur = (round(a[0], 1), round(a[1], 1))
            if k == "l":
                b = f(s_[1]); dx, dy = round(b[0] - cur[0], 1), round(b[1] - cur[1], 1)
                if dx == 0 and dy == 0: continue
                out.append("h" + fmt(dx) if dy == 0 else "v" + fmt(dy) if dx == 0 else "l" + nums(dx, dy))
                cur = (round(cur[0] + dx, 1), round(cur[1] + dy, 1))
            else:
                c = [f(q) for q in s_[1:]]
                out.append("c" + nums(*[round(v - cur[i % 2], 1) for p in c for i, v in enumerate(p)]))
                cur = (round(cur[0] + round(c[2][0] - cur[0], 1), 1), round(cur[1] + round(c[2][1] - cur[1], 1), 1))
    return "".join(out)

def pathd(segs, f):
    out, last = [], None
    for k, s in segs:
        a = f(s[0])
        if last is None or abs(a[0] - last[0]) > .05 or abs(a[1] - last[1]) > .05: out.append(f"M{a[0]:.1f} {a[1]:.1f}")
        if k == "l": b = f(s[1]); out.append(f"L{b[0]:.1f} {b[1]:.1f}")
        else:
            c = [f(q) for q in s[1:]]; out.append("C" + " ".join(f"{x:.1f} {y:.1f}" for x, y in c)); b = c[-1]
        last = b
    return "".join(out).replace(".0 ", " ").replace(".0L", "L").replace(".0M", "M").replace(".0C", "C")

def debug(view, out):
    """Crop view with entity ids on long straight lines, for choosing what to drop."""
    ents = select(view); x0, y0, x1, y1 = view["crop"]
    s = view.get("scale", 3); parts = []
    for e in ents:
        d = pathd(e["segs"], lambda q: ((q.x - x0) * s, (q.y - y0) * s))
        parts.append(f'<path d="{d}" stroke="{e["col"] if e["col"]!="#000000" else "#111"}" fill="none" stroke-width="1"/>')
        b = e["box"]
        if len(e["segs"]) <= 2 and size(b) > view.get("label", 25):
            parts.append(f'<text x="{((b[0]+b[2])/2-x0)*s}" y="{((b[1]+b[3])/2-y0)*s}" font-size="13" fill="#d00">{e["id"]}</text>')
    W, H = (x1 - x0) * s, (y1 - y0) * s
    open(out, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><rect width="100%" height="100%" fill="#fff"/>{"".join(parts)}</svg>')

def normalise(view, box=400, pad=None):
    """Fit the view into the 400 box (keeping aspect), return {colour: path d} and the transform."""
    ents = select(view)
    xs = [v for e in ents for v in (e["box"][0], e["box"][2])]; ys = [v for e in ents for v in (e["box"][1], e["box"][3])]
    bx0, by0, bx1, by1 = min(xs), min(ys), max(xs), max(ys)
    fit = view.get("fit", (60, 40, 340, 360))
    sc = min((fit[2] - fit[0]) / (bx1 - bx0), (fit[3] - fit[1]) / (by1 - by0))
    ox = (fit[0] + fit[2]) / 2 - (bx0 + bx1) / 2 * sc; oy = (fit[1] + fit[3]) / 2 - (by0 + by1) / 2 * sc
    f = lambda q: (q.x * sc + ox, q.y * sc + oy)
    groups = {}
    # order top-to-bottom, then left-to-right, so the line draws on as a sweep
    for e in sorted(ents, key=lambda e: (round((e["box"][1] + e["box"][3]) / 2 / 6), e["box"][0])):
        k = view.get("kinds", {}).get(e["col"])
        if not k: k = "cad" if cad_size(e) * sc >= view.get("fine", 9) else "cadfine"
        groups.setdefault(k, []).append(e)
    paths = {k: compact(v, f, sc) for k, v in groups.items()}
    return paths, (sc, ox, oy)
