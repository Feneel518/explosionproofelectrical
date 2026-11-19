import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { extractedOrderPdfSchema, reviewedOrderPdfSchema, type ReviewedOrderPdf } from "../src/lib/gmail/orderPdfSchema";
import { matchPdfItem } from "../src/lib/gmail/orderPdfDraft";
import { extractOrderPdf, pdfReadingErrorMessage } from "../src/lib/gmail/orderPdf";

const review: ReviewedOrderPdf = { reviewed: true, currency: "INR", poNumber: "PO-17", poDate: "2026-11-17", buyerName: "Buyer Ltd", items: [{ title: "Switch", description: null, sku: "SW-10", typeNumber: null, quantity: 10, unit: "Nos", unitPrice: 1500, hsnCode: null, page: 1 }] };

test("missing prices stay unknown and require review rather than becoming free items", () => {
  const parsed = extractedOrderPdfSchema.parse({ documentType: "RFQ", poNumber: null, poDate: null, buyerName: null, currency: null, warnings: [], items: [{ ...review.items[0], unitPrice: null, evidence: "10 switches", needsReview: true }] });
  assert.equal(parsed.items[0].unitPrice, null);
  assert.equal(reviewedOrderPdfSchema.safeParse({ ...review, items: parsed.items }).success, false);
  assert.equal(reviewedOrderPdfSchema.safeParse({ ...review, reviewed: false }).success, false);
  assert.equal(reviewedOrderPdfSchema.safeParse({ ...review, currency: "USD" }).success, false);
  assert.equal(reviewedOrderPdfSchema.safeParse(review).success, true);
});

test("review rejects invalid calendar dates, fractional quantities and excessive line values", () => {
  assert.equal(reviewedOrderPdfSchema.safeParse({ ...review, poDate: "2026-02-30" }).success, false);
  for (const item of [{ ...review.items[0], quantity: 1.5 }, { ...review.items[0], quantity: 0 }, { ...review.items[0], unitPrice: -1 }, { ...review.items[0], quantity: 1_000_000, unitPrice: 999_999_999 }]) {
    assert.equal(reviewedOrderPdfSchema.safeParse({ ...review, items: [item] }).success, false);
  }
});

test("catalog links require one exact code match and preserve ambiguous or conflicting rows as custom items", () => {
  const variant = { id: "v1", productId: "p1", variant: "Switch", sku: "SW-10", typeNumber: "EX-10", product: { name: "Switch", hsnCode: "8536" } };
  assert.equal(matchPdfItem({ ...review.items[0], sku: " sw-10 " }, [variant])?.id, "v1");
  assert.equal(matchPdfItem({ ...review.items[0], sku: null, typeNumber: "ex-10" }, [variant])?.id, "v1");
  assert.equal(matchPdfItem(review.items[0], [variant, { ...variant, id: "v2" }]), null);
  assert.equal(matchPdfItem({ ...review.items[0], typeNumber: "OTHER" }, [variant]), null);
  assert.equal(matchPdfItem({ ...review.items[0], sku: "SW-1" }, [variant]), null);
  assert.equal(matchPdfItem({ ...review.items[0], sku: null }, [variant]), null);
});

test("invalid and oversized PDFs stop before any AI request", async () => {
  await assert.rejects(extractOrderPdf(new Uint8Array([1, 2, 3]), "invalid.pdf"), /unlocked, valid PDF/);
  await assert.rejects(extractOrderPdf(new Uint8Array(12 * 1024 * 1024 + 1), "large.pdf"), /12 MB/);
  const pdf = await PDFDocument.create();
  for (let page = 0; page < 26; page++) pdf.addPage();
  await assert.rejects(extractOrderPdf(await pdf.save(), "long.pdf"), /25 PDF pages/);
});

test("account activation failures return a useful message without exposing upstream data", () => {
  const message = pdfReadingErrorMessage(new Error("Free tier users do not have access to this model. upstream-private-data"));
  assert.match(message, /account owner/i);
  assert.ok(!message.includes("upstream-private-data"));
});
