import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to an isolated, migrated test database. This check never uses DATABASE_URL.");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
import { createGmailSalesDraft } from "../src/lib/gmail/salesDraft";
import { applyGmailPdfOrderDraft } from "../src/lib/gmail/orderPdfDraft";
import { SalesOrderSchema } from "../src/lib/validators/dashboard/sales/orders/OrderValidator";
import type { ReviewedOrderPdf } from "../src/lib/gmail/orderPdfSchema";
import { linkSalesConversation, inheritQuotationConversations } from "../src/lib/gmail/salesConversation";
import { recordQuotationDelivery, quotationStatusAfterOrderUnlink } from "../src/lib/quotations/recordDelivery";
import { getSalesAttention } from "../src/lib/gmail/attention";

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
    // An order received on a quotation's thread keeps both records connected, in either direction.
    const replyMessage = await tx.gmailNotification.create({ data: {
      userId: owner.userId, messageId: `tracking-${randomUUID()}`, threadId: `tracking-${randomUUID()}`,
      subject: "RFQ: tracked quotation", sender: '"Test Buyer" <gmail-integration@example.invalid>', receivedAt: new Date(),
    } });
    const sourceQuote = await createGmailSalesDraft(tx, owner.userId, replyMessage, "QUOTATION");
    const followupAt = new Date(Date.now() + 86400000);
    await tx.quotation.update({ where: { id: sourceQuote.id }, data: { status: "READY", nextFollowupAt: followupAt } });
    await tx.quotationFollowup.create({ data: { quotationId: sourceQuote.id, scheduledAt: followupAt, note: "Existing follow-up", createdById: owner.userId } });
    const sourceOrder = await createGmailSalesDraft(tx, owner.userId, replyMessage, "ORDER");
    const linkedOrder = await tx.salesOrder.findUniqueOrThrow({ where: { id: sourceOrder.id } });
    assert.equal(linkedOrder.quotationId, sourceQuote.id);
    assert.equal(linkedOrder.sourceType, "QUOTATION");
    assert.equal((linkedOrder.draftData as { header: { quotationId: string } }).header.quotationId, sourceQuote.id);
    assert.equal((await tx.quotation.findUniqueOrThrow({ where: { id: sourceQuote.id } })).nextFollowupAt?.getTime(), followupAt.getTime(), "A draft must not clear follow-up reminders.");
    const nextThread = `tracking-${randomUUID()}`;
    await linkSalesConversation(tx, owner.userId, nextThread, "ORDER", sourceOrder.id);
    await linkSalesConversation(tx, owner.userId, nextThread, "ORDER", sourceOrder.id);
    assert.equal(await tx.gmailThreadLink.count({ where: { userId: owner.userId, threadId: nextThread } }), 2, "Order links also expose the source quotation, without duplicates.");
    const thirdThread = `tracking-${randomUUID()}`;
    await linkSalesConversation(tx, owner.userId, thirdThread, "QUOTATION", sourceQuote.id);
    assert.equal(await tx.gmailThreadLink.count({ where: { userId: owner.userId, threadId: thirdThread, salesOrderId: sourceOrder.id } }), 1, "Quotation links also expose the related order.");
    await inheritQuotationConversations(tx, owner.userId, sourceQuote.id, sourceOrder.id);
    assert.equal(await tx.gmailThreadLink.count({ where: { userId: owner.userId, salesOrderId: sourceOrder.id } }), 3);
    assert.equal(await tx.gmailThreadLink.count({ where: { userId: "another-user", threadId: nextThread } }), 0);
    const customerReply = await tx.gmailNotification.create({ data: { userId: owner.userId, threadId: nextThread, messageId: `reply-${randomUUID()}`, subject: "RFQ: customer confirmed order", sender: "gmail-integration@example.invalid", receivedAt: new Date() } });
    assert.equal(await tx.gmailThreadLink.count({ where: { userId: owner.userId, threadId: customerReply.threadId } }), 2, "Future replies inherit the same quotation/order history by thread.");
    const attentionBeforeSend = await getSalesAttention(tx, owner.userId);
    assert.ok(attentionBeforeSend.items.some(item => item.key === `ready:${sourceQuote.id}`));
    assert.ok(attentionBeforeSend.items.some(item => item.key === `order:${sourceOrder.id}`));
    assert.ok(attentionBeforeSend.items.some(item => item.key === `message:${customerReply.id}`));
    assert.ok(!attentionBeforeSend.items.some(item => item.key === `followup:${sourceQuote.id}`), "Unsent quotations belong in Ready, not Follow-ups.");
    const privateQueue = await getSalesAttention(tx, "another-user");
    assert.equal(privateQueue.total, 0, "The attention queue must not expose another mailbox owner's records.");
    const dueQueueBeforeSend = await getSalesAttention(tx, owner.userId, new Date(followupAt.getTime() + 1000));
    const reminderAt = new Date(Date.now() + 3 * 86400000);
    const attempt = async (status: "SENT" | "FAILED" | "UNKNOWN", expectedUpdatedAt?: Date, messageId?: string) => {
      const quotation = await tx.quotation.findUniqueOrThrow({ where: { id: sourceQuote.id } });
      const requestId = randomUUID();
      await tx.quotationEmailDelivery.create({ data: { id: requestId, quotationId: sourceQuote.id, userId: owner.userId, sender: "sales@example.invalid", recipient: "buyer@example.invalid", subject: "Test quotation" } });
      await recordQuotationDelivery(tx, { requestId, quotationId: sourceQuote.id, userId: owner.userId, expectedUpdatedAt: expectedUpdatedAt || quotation.updatedAt, status, messageId, followupAt: reminderAt });
      return (await tx.quotation.findUniqueOrThrow({ where: { id: sourceQuote.id } })).status;
    };
    assert.equal(await attempt("FAILED"), "READY", "A rejected send must not mark the quotation sent.");
    assert.equal(await attempt("UNKNOWN"), "READY", "An unconfirmed send must not mark the quotation sent.");
    assert.equal(await tx.quotationFollowup.count({ where: { quotationId: sourceQuote.id } }), 1, "Failed and uncertain sends must not create follow-ups.");
    await assert.rejects(attempt("SENT"), /receipt is required/);
    assert.equal(await attempt("SENT", undefined, "confirmed-gmail-message"), "SENT");
    assert.equal(await tx.quotationFollowup.count({ where: { quotationId: sourceQuote.id } }), 2, "A successful send schedules its selected follow-up.");
    assert.equal((await tx.quotation.findUniqueOrThrow({ where: { id: sourceQuote.id } })).nextFollowupAt?.getTime(), followupAt.getTime(), "Keep an existing earlier follow-up.");
    const queueAfterSend = await getSalesAttention(tx, owner.userId, new Date(followupAt.getTime() + 1000));
    assert.ok(!queueAfterSend.items.some(item => item.key === `ready:${sourceQuote.id}`));
    assert.equal(queueAfterSend.counts.FOLLOWUPS, dueQueueBeforeSend.counts.FOLLOWUPS + 1, "The sent quotation must enter the due follow-up queue, even when older tasks fill its first page.");
    assert.equal(await quotationStatusAfterOrderUnlink(tx, sourceQuote.id, followupAt), "FOLLOWUP");
    await tx.quotation.update({ where: { id: sourceQuote.id }, data: { status: "WON" } });
    assert.equal(await attempt("SENT", undefined, "resent-won-quotation"), "WON", "Resending must not reset a later sales status.");
    assert.equal(await tx.quotationFollowup.count({ where: { quotationId: sourceQuote.id } }), 2, "Do not schedule follow-ups for a won quotation.");
    const edited = await tx.quotation.update({ where: { id: sourceQuote.id }, data: { status: "READY" } });
    const olderVersion = new Date(edited.updatedAt.getTime() - 1000);
    assert.equal(await attempt("SENT", olderVersion, "sent-earlier-version"), "READY", "Sending an old version must not mark a newer edited version sent.");
    assert.equal(await tx.quotationFollowup.count({ where: { quotationId: sourceQuote.id } }), 2, "Do not schedule a reminder from a stale send.");
    assert.equal(await quotationStatusAfterOrderUnlink(tx, sourceQuote.id, null), "READY", "Unlinking an order must not mark an edited unsent quotation sent.");
    throw rollback;
  }, { timeout: 60_000 }), error => error === rollback);
  console.log("PASS: sales drafts, PDF item autofill, exact catalog links, private access, duplicate prevention and preservation of existing items (all rolled back).");
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Sales integration check failed."); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); await (globalThis as unknown as { pgPool?: { end: () => Promise<void> } }).pgPool?.end(); });
