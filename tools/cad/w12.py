# Hand trace of the EXEC-WG-12W front elevation (scanned drawing), in source-image pixels.
import re
S, OX, OY = .42, 40, 22
def T(d):
    """Scale absolute path data from image px into the 400 box."""
    out = []; toks = re.findall(r"[A-Za-z]|-?\d+(?:\.\d+)?", d); i = 0; cmd = None; n = 0
    for t in toks:
        if t.isalpha(): cmd = t; out.append(t); n = 0; continue
        v = float(t)
        if cmd == "A":
            k = n % 7
            v = v * S if k in (0, 1) else (v * S + OX if k == 5 else v * S + OY if k == 6 else v)
        else: v = v * S + (OX if n % 2 == 0 else OY)
        out.append(f"{v:.1f}".rstrip("0").rstrip(".")); n += 1
    s = ""
    for t in out: s += t if (t.isalpha() or not s or s[-1].isalpha() or t.startswith("-")) else " " + t
    return s
def circ(cx, cy, r): return f"M{cx-r} {cy}A{r} {r} 0 1 0 {cx+r} {cy}A{r} {r} 0 1 0 {cx-r} {cy}"
def mirror(d, ax=385):
    toks = re.findall(r"[A-Za-z]|-?\d+(?:\.\d+)?", d); out = []; cmd = None; n = 0
    for t in toks:
        if t.isalpha(): cmd = t; out.append(t); n = 0; continue
        v = float(t)
        if cmd == "A":
            k = n % 7
            if k == 5: v = 2 * ax - v
            if k == 4: v = 1 - v
        elif n % 2 == 0: v = 2 * ax - v
        out.append(f"{v:g}"); n += 1
    return " ".join(out)

main = []; fine = []
# U mounting bracket (rod drawn as two parallel lines)
main.append("M40 560L40 45Q40 15 70 15L695 15Q725 15 725 45L725 560")
main.append("M52 560L52 50Q52 27 75 27L690 27Q713 27 713 50L713 560")
fine.append("M386 15L386 27M668 15L668 27")                       # mounting holes on the bracket
# side pivots: lug block, bolt head
for d in ("M57 490L80 490L80 572L57 572Z", "M30 503L40 503L40 545L30 545Z"):
    main.append(d); main.append(mirror(d))
fine.append(circ(68, 525, 8)); fine.append(mirror(circ(68, 525, 8)))
# dome cover with lifting horns and centre rib
horn = "M160 292L160 236Q162 194 200 192Q228 194 234 214"
main.append(horn); main.append(mirror(horn))
fine.append("M172 292L172 240Q174 206 200 204Q220 206 224 220"); fine.append(mirror("M172 292L172 240Q174 206 200 204Q220 206 224 220"))
main.append("M234 214L536 214")
main.append("M374 214L374 196Q376 190 385 190Q394 190 396 196L396 214M374 214L374 292M396 214L396 292")
main.append("M150 292L620 292L620 348L150 348Z"); fine.append("M156 302L614 302")
main.append("M136 348L634 348L634 374L136 374Z")
for x in (190, 255, 330, 440, 515, 580): fine.append(f"M{x} 348L{x} 374")
# body and lower band
main.append("M205 374L205 520M565 374L565 520")
main.append("M205 520L565 520")
fine.append("M205 505L565 505")
# cable entries: two glands joined by a link, two earth bosses
for cx in (330, 440):
    main.append(circ(cx, 435, 46)); main.append(circ(cx, 435, 34))
    fine.append(f"M{cx-22} 425L{cx+22} 425M{cx-24} 435L{cx+24} 435M{cx-22} 445L{cx+22} 445")
fine.append("M376 431L394 431M376 439L394 439")
for cx in (255, 515):
    main.append(circ(cx, 430, 22)); fine.append(circ(cx, 430, 10))
# cooling fins either side
for x0, x1 in ((205, 140), (178, 100), (152, 66)):
    f = f"M{x0} 420Q{x0-12} 418 {x0-14} 450L{x0-20} 500Q{x0-30} 548 {x1} 578"
    main.append(f); main.append(mirror(f))
    g = f"M{x0-12} 432Q{x0-20} 445 {x0-24} 480L{x0-32} 520Q{x0-42} 556 {x1+16} 578"
    fine.append(g); fine.append(mirror(g))
# base plate
main.append("M48 578L722 578L722 596L48 596Z")
# guard anchor screws
for cx in (192, 578):
    main.append(f"M{cx-18} 596L{cx-18} 608L{cx+18} 608L{cx+18} 596"); fine.append(circ(cx, 604, 6))
# glass dome
main.append("M222 596A163 163 0 0 0 548 596")
fine.append("M262 616Q270 700 330 742")
# wire guard: outer bows, inner bows, foot
outer = "M178 608Q176 700 260 760Q300 788 330 790"
inner = "M215 608Q222 690 300 748Q330 770 345 788"
main.append(outer); main.append(mirror(outer)); fine.append(inner); fine.append(mirror(inner))
main.append("M320 790L450 790L450 806L320 806Z")
fine.append("M376 752L376 790M394 752L394 790")
paths = {"cad": T("".join(main)), "cadfine": T("".join(fine))}
if __name__ == "__main__":
    body = "".join(f'<path d="{d}" fill="none" stroke="{"#f0f2ed" if k=="cad" else "#7fa3bb"}" stroke-width="{0.9 if k=="cad" else 0.7}"/>' for k, d in paths.items())
    open("p-wellglass12.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="800" height="800"><rect width="400" height="400" fill="#0a2b40"/>{body}</svg>')
    # overlay on the scan for checking
    ov = "".join(f'<path d="{d}" fill="none" stroke="#e46414" stroke-width="1.2"/>' for d in paths.values())
    open("ov-wellglass12.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400" width="800" height="800"><image href="w12-front.png" x="{OX}" y="{OY}" width="{764*S}" height="{832*S}" opacity=".55"/>{ov}</svg>')
    print(sum(len(d) for d in paths.values()))
