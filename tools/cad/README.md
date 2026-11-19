# GA drawing → site line drawings

`src/components/site/cad-drawings.ts` is generated from ExEC's general-arrangement PDFs.

1. Put the AutoCAD-plotted PDFs in `/mnt/user-data/uploads/` (or change the glob in `cad.py`).
2. `pip install pymupdf`, then `python3 gen_cad.py` (run from this folder).

- `views.py`: per drawing, the page crop of the view to use, boxes whose small entities
  (text, arrows) are removed, and entity ids to drop (dimension and leader lines).
  Centre lines through circles are removed automatically.
- `w12.py`: hand trace of the 12 W well glass (that PDF is a scanned image, not vectors).
- `gen_cad.py`: fits each view to the 400 × 400 drawing box and adds the overall sizes (mm)
  and callouts.
