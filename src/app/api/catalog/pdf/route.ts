import { getCatalogPdfProducts } from "@/lib/marketing/catalog";
import { renderCatalogPdf } from "@/lib/marketing/catalogPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Coalesce concurrent downloads within this instance without retaining stale catalog data.
let pending: Promise<Buffer> | undefined;
export async function GET() {
  try {
    if (!pending) {
      pending = getCatalogPdfProducts().then((products) => {
        if (!products.length) throw new Error("EMPTY_CATALOG");
        return renderCatalogPdf(products);
      }).finally(() => { pending = undefined; });
    }
    const pdf = await pending;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="ExEC-Product-Catalog.pdf"',
        "Content-Length": String(pdf.length),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const empty = error instanceof Error && error.message === "EMPTY_CATALOG";
    console.error("Catalog PDF generation failed", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ error: empty ? "The product collection is being updated. Please try again later." : "We could not generate the catalog. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
