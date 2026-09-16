import { NextRequest, NextResponse } from "next/server";
import { getCatalogProductDetail } from "@/lib/marketing/catalog";
import { legacyProductCandidates } from "@/lib/seo/legacy-products";
import { absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ legacySlug: string[] }> }) {
  const { legacySlug } = await context.params;
  if (legacySlug.length === 1) {
    for (const slug of legacyProductCandidates(legacySlug[0])) {
      const data = await getCatalogProductDetail(slug);
      if (data) {
        const destination = new URL(absoluteUrl(`/catalog/${data.product.slug}`));
        destination.search = request.nextUrl.search;
        return NextResponse.redirect(destination, 301);
      }
    }
  }
  // Removed or unknown items must not become soft 404s on an unrelated catalog page.
  return new NextResponse("Product no longer available. Browse /catalog for current products.", {
    status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, follow" },
  });
}
