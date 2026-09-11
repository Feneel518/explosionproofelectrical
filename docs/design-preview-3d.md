# ExEC 45W wellglass showcase

The homepage and `/design-preview` use the requested single background colour, `#072436`, and a technical drawing hero inspired by the supplied Heron reference. The hero displays the user's body, cover and ring STL geometry, with finished, drawing and exploded views. The hero, cards and surrounding site share the same dark surface, with light drawing lines and readable controls. Model geometry and interactions are preserved.

## Product collection and sharing

- `/catalog` lists active, non-deleted backend products in active, non-deleted categories. Search includes product names, descriptions, type numbers, ratings and SKUs. Category, search and sort selections are stored in the URL.
- `/catalog/[productSlug]` displays active variants, their images, drawings and recorded technical specifications. The `variant` query parameter retains a selected configuration when shared.
- Share uses the phone's native share sheet where supported, with clipboard and manual-copy fallbacks. WhatsApp opens a prepared message for the visitor to send. Print / PDF uses the browser's print dialog with a light print stylesheet.
- Missing images have an explicit placeholder; missing specifications are not replaced with invented ratings. Backend errors, missing products and empty search results have dedicated states.
- Quote enquiries preselect the viewed product and variant and use the existing enquiry backend.
- The homepage includes six backend products and content from the existing site's company story, custom-panel capability and mission.

## Geometry and assembly

- Body: 53,268 triangles.
- Cover: 19,376 triangles.
- Ring: 13,928 triangles.

All 86,572 original triangles are retained. Conversion indexes shared positions, applies rigid orientation/placement and a uniform presentation scale. Flat face normals are reconstructed in the renderer, matching STL's faceted surfaces. No source file is modified, no triangles are removed, and no part is reshaped. STL has no material appearance, so metallic finishes are assigned for the showcase.

The files use independent origins. At the user's request, assembly placement was inferred: the cover is inverted over the body, the ring sits beneath the housing, and an added dome glass and three-support wire guard extend below it. Those added parts, their fit and the exploded travel are visual approximations, not manufacturing CAD. Refine them against an assembled reference when available.

## Rebuild the web asset

Run `node scripts/prepare-wellglass.mjs <source-directory>`. The source directory must contain `45w well glass body for RPT.stl`, `WELL GLASS 45W- COVER.stl` and `WELL GLASS 45W- RING.stl`.

This writes `public/models/exec-wellglass-45w.glb` (about 1.47 MB) and its geometry manifest. Configuration lives in `src/lib/marketing/productExperience.ts`.

The GLB contains five moving part groups and precomputed drawing lines. Each group has `showcaseTravel` metadata for its vertical exploded offset. Original STL meshes have `stlSurface` metadata; the glass and guard have `addedVisual` metadata. A replacement asset must preserve this structure to support the current interactions.

## Rendering performance

- Five surface draw calls in finished mode; ten including drawing outlines.
- No browser-side STL parsing, geometry generation or edge extraction.
- No glass transmission pass; lightweight transparency and environment reflections.
- Pixel ratio capped at 1.25, with lower resolution on devices showing sustained slow animation.
- Rendering stops while scrolling, idle, offscreen or in a hidden tab, and resumes after scrolling settles. Rotation is opt-in; reduced motion is supported.
- Passive pointer controls provide rotation without blocking wheel or touch scrolling. Vertical touch gestures scroll the page; horizontal gestures rotate the model.
- A subtle background pattern replaces the full-page filtered texture overlay, reducing scroll painting and compositing work.
- Shaders compile before revealing the model. A product photograph appears if loading or WebGL fails.

QA covers the three views, rotation, responsive layouts, mobile scrolling and navigation, the enquiry modal, reduced motion and WebGL fallback. Performance measurements are local browser measurements, not a guarantee for every device.

The finished-product reference supplied on 2026-09-09 guides the revised ring shoulder seating, deeper glass bell and sparse guard hoops. The ring shoulder at source Z=16.8 is positioned against the body inner flange at Z=-83. The original part geometry is unchanged.
