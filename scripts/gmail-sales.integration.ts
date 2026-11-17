import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma/db";
import { createGmailSalesDraft } from "../src/lib/gmail/salesDraft";
import { applyGmailPdfOrderDraft } from "../src/lib/gmail/orderPdfDraft";
import { SalesOrderSchema } from "../src/lib/validators/dashboard/sales/orders/OrderValidator";
import type { ReviewedOrderPdf } from "../src/lib/gmail/orderPdfSchema";

// Run against an already migrated database. Every test record and counter change
// is rolled back; no real quotation or order remains after this check.
async function main() {
  const owner = await prisma.gmailConnection.findFirst({ select: { userId: true } });
  assert.ok(owner, "Connect a test mailbox before running this integration check.");
  const rollback = new Error("ROLL_BACK_GMAIL_SALES_CHECK");
  await assert.rejects(prisma.$transaction(async tx => {
    const message = await tx.gmailNotification.create({ data: {
      userId: owner.userId, messageId: `integration-${randomUUID()}`, threadId: `integration-${randomUUID()}`,
      subject: "Inquiry: test switches", sender: '"Test Buyer" <gmail-integration@example.invalid>',
      receivedAt: new Date(), bodyText: "Please quote 10 switches. Confirm the specification before finalizing.",
    } });
    await assert.rejects(createGmailSalesDraft(tx, "another-user", message, "QUOTATION"), /Email not found/);
    for (const kind of ["QUOTATION", "ORDER"] as const) {
      const first = await createGmailSalesDraft(tx, owner.userId, message, kind);
      const repeated = await createGmailSalesDraft(tx, owner.userId, message, kind);
      assert.equal(first.reused, false);
      assert.equal(repeated.reused, true);
      assert.equal(repeated.id, first.id, "A repeated click must reuse the same draft.");
      assert.match(first.href, /\/edit$/);
      const record = kind === "QUOTATION" ? await tx.quotation.findUniqueOrThrow({ where: { id: first.id } }) : await tx.salesOrder.findUniqueOrThrow({ where: { id: first.id } });
      assert.equal(record.status, "DRAFT");
      assert.equal(record.receivedFromEmail, "gmail-integration@example.invalid");
      assert.equal(record.clientName, "Test Buyer");
      assert.equal(record.createdById, owner.userId);
      assert.equal((record.draftData as { items: unknown[] }).items.length, 0);
      assert.match(JSON.stringify(record.draftData), /Please quote 10 switches/);
    }
    assert.equal(await tx.gmailThreadLink.count({ where: { userId: owner.userId, threadId: message.threadId } }), 2);
    assert.equal(await tx.gmailThreadLink.count({ where: { userId: "another-user", threadId: message.threadId } }), 0);
    assert.equal((await tx.gmailNotification.findUniqueOrThrow({ where: { id: message.id } })).status, "IN_PROGRESS");
    const category = await tx.category.findFirstOrThrow({ select: { id: true } });
    const product = await tx.product.create({ data: { name: "PDF integration switch", slug: `pdf-check-${randomUUID()}`, categoryId: category.id, zones: [] } });
    const variant = await tx.productVariant.create({ data: { productId: product.id, variant: "Test switch", sku: `PDF-${randomUUID()}` } });
    const reading = await tx.gmailPdfImport.create({ data: { userId: owner.userId, notificationId: message.id, threadId: message.threadId, messageId: message.messageId, partId: "1", filename: "test-order.pdf", status: "READY", result: {} } });
    const review: ReviewedOrderPdf = { reviewed: true, currency: "INR", poNumber: "TEST-PO-17", poDate: "2026-11-17", buyerName: "PDF buyer", items: [{ title: "Test switch", description: "PDF source specification", sku: variant.sku, typeNumber: null, quantity: 4, unit: "Nos", unitPrice: 1250, hsnCode: null, page: 1 }] };
    await assert.rejects(applyGmailPdfOrderDraft(tx, "another-user", reading.id, review), /not found/);
    const filled = await applyGmailPdfOrderDraft(tx, owner.userId, reading.id, review);
    const repeatedFill = await applyGmailPdfOrderDraft(tx, owner.userId, reading.id, review);
    assert.equal(repeatedFill.id, filled.id);
    assert.equal(repeatedFill.reused, true);
    const filledOrder = await tx.salesOrder.findUniqueOrThrow({ where: { id: filled.id } });
    const draft = SalesOrderSchema.parse(filledOrder.draftData);
    assert.equal(draft.items.length, 1);
    assert.equal(draft.items[0].qty, 4);
    assert.equal(draft.items[0].unitPrice, 1250);
    assert.equal(draft.items[0].variantId, variant.id);
    assert.equal(filledOrder.poNumber, "TEST-PO-17");
    const nextPdf = await tx.gmailPdfImport.create({ data: { userId: owner.userId, notificationId: message.id, threadId: message.threadId, messageId: message.messageId, partId: "2", filename: "second-order.pdf", status: "READY", result: {} } });
    const nextOrder = await applyGmailPdfOrderDraft(tx, owner.userId, nextPdf.id, { ...review, poNumber: "TEST-SECOND-PO" });
    assert.notEqual(nextOrder.id, filled.id, "An existing draft's items must not be overwritten.");
    assert.deepEqual((await tx.salesOrder.findUniqueOrThrow({ where: { id: filled.id } })).draftData, filledOrder.draftData);
    throw rollback;
  }, { timeout: 60_000 }), error => error === rollback);
  console.log("PASS: sales drafts, PDF item autofill, exact catalog links, private access, duplicate prevention and preservation of existing items (all rolled back).");
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Sales integration check failed."); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); await (globalThis as unknown as { pgPool?: { end: () => Promise<void> } }).pgPool?.end(); });
