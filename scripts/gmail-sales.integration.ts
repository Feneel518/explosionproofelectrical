import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma/db";
import { createGmailSalesDraft } from "../src/lib/gmail/salesDraft";

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
    throw rollback;
  }, { timeout: 60_000 }), error => error === rollback);
  console.log("PASS: quotation and order drafts, sender prefill, duplicate prevention, private links and work status (all rolled back).");
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Sales integration check failed."); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); await (globalThis as unknown as { pgPool?: { end: () => Promise<void> } }).pgPool?.end(); });
