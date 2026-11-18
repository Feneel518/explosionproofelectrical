import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL to an isolated, migrated test database. This check never uses DATABASE_URL.");
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
import { linkSalesConversation, inheritQuotationConversations } from "../src/lib/gmail/salesConversation";
import { recordQuotationDelivery, quotationStatusAfterOrderUnlink } from "../src/lib/quotations/recordDelivery";
import { getSalesAttention } from "../src/lib/gmail/attention";

// Run against an already migrated database. Every test record and counter change
// is rolled back; no real quotation or order remains after this check.

async function createFixture(tx: Prisma.TransactionClient, userId: string, threadId: string, kind: "QUOTATION" | "ORDER", quotationId?: string) {
  const fy = "FY2026-27";
  const key = kind === "QUOTATION" ? `EXQN-${fy}` : `SO:${fy}`;
  const counter = await tx.fiscalCounter.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
  const header = { quotationId: quotationId || null, sourceType: quotationId ? "QUOTATION" : "DIRECT" };
  const record = kind === "QUOTATION"
    ? await tx.quotation.create({ data: { quoteNo: counter.value, quoteFy: fy, gst: "CGST_SGST_18", createdById: userId, draftData: { header: {}, items: [] } }, select: { id: true } })
    : await tx.salesOrder.create({ data: { orderNo: counter.value, orderFy: fy, quotationId, sourceType: quotationId ? "QUOTATION" : "DIRECT", gst: "CGST_SGST_18", createdById: userId, draftData: { header, items: [] } }, select: { id: true } });
  await linkSalesConversation(tx, userId, threadId, kind, record.id);
  return record;
}

async function main() {
  const owner = await prisma.gmailConnection.findFirst({ select: { userId: true } });
  assert.ok(owner, "Connect a test mailbox before running this integration check.");
  const rollback = new Error("ROLL_BACK_GMAIL_SALES_CHECK");
  await assert.rejects(prisma.$transaction(async tx => {
    const replyMessage = await tx.gmailNotification.create({ data: {
      userId: owner.userId, messageId: `tracking-${randomUUID()}`, threadId: `tracking-${randomUUID()}`,
      subject: "RFQ: tracked quotation", sender: '"Test Buyer" <gmail-integration@example.invalid>', receivedAt: new Date(),
    } });
    const sourceQuote = await createFixture(tx, owner.userId, replyMessage.threadId, "QUOTATION");
    const followupAt = new Date(Date.now() + 86400000);
    await tx.quotation.update({ where: { id: sourceQuote.id }, data: { status: "READY", nextFollowupAt: followupAt } });
    await tx.quotationFollowup.create({ data: { quotationId: sourceQuote.id, scheduledAt: followupAt, note: "Existing follow-up", createdById: owner.userId } });
    const sourceOrder = await createFixture(tx, owner.userId, replyMessage.threadId, "ORDER", sourceQuote.id);
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
  console.log("PASS: conversation links, mailbox privacy, quotation delivery transitions and follow-up retention (all rolled back).");
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Sales integration check failed."); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); await pool.end(); });
