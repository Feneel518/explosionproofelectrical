import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/check/requireAuth";
import { getQuotationByIdAction } from "@/lib/actions/dashboard/sales/quotation/getQuotationByIdAction";
import { quotationPdfFilename, renderQuotationPdf } from "@/lib/quotations/pdf";
import { quotationPdfSession } from "@/lib/quotations/pdfSession";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid quotation." }, { status: 400 });
  try {
    const result = await getQuotationByIdAction(id);
    if (!result.ok || result.quotation.deletedAt) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    const quotation = result.quotation;
    if (["DRAFT", "CANCELLED"].includes(quotation.status)) return NextResponse.json({ error: "Finalize an active quotation first." }, { status: 409 });
    if (request.nextUrl.searchParams.get("version") !== quotation.updatedAt.toISOString()) return NextResponse.json({ error: "Quotation changed. Refresh the page before previewing or sending." }, { status: 409 });
    const pdf = await renderQuotationPdf(quotation, await quotationPdfSession());
    return new NextResponse(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${quotationPdfFilename(quotation)}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return NextResponse.json({ error: "Could not generate the quotation PDF. Check the selected images and try again." }, { status: 500 });
  }
}
