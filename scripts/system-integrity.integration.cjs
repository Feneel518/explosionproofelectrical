/* PostgreSQL integration checks in a uniquely named, disposable schema.
   Prefer TEST_DATABASE_URL. Testing in another configured database requires
   the explicit ALLOW_ISOLATED_SCHEMA_TEST=1 flag. No public tables are changed. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { randomBytes, randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { load } = require('./test-loader.cjs');

const url = process.env.TEST_DATABASE_URL || (process.env.ALLOW_ISOLATED_SCHEMA_TEST === '1' ? process.env.DATABASE_URL : null);
if (!url) throw new Error('Set TEST_DATABASE_URL, or explicitly enable a disposable schema test with ALLOW_ISOLATED_SCHEMA_TEST=1.');
const schema = 'codex_integrity_test_' + randomBytes(6).toString('hex');
const safeSchema = () => { assert.match(schema, /^codex_integrity_test_[a-f0-9]{12}$/); return '"' + schema + '"'; };
const directUrl = new URL(url);
if (directUrl.hostname.endsWith(".neon.tech")) directUrl.hostname = directUrl.hostname.replace("-pooler.", ".");
const pool = new Pool({ connectionString: directUrl.toString(), max: 6, options: "-c search_path=" + schema });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
let created = false;
async function main() {
  const admin = await pool.connect();
  try {
    await admin.query('CREATE SCHEMA ' + safeSchema()); created = true;
    await admin.query('SET search_path TO ' + safeSchema() + ', pg_catalog');
    const baseline = readFileSync('tmp/pre-system-integrity.sql', 'utf8').replace('CREATE SCHEMA IF NOT EXISTS "public";', '');
    assert.ok(!baseline.includes('"public"'), 'The baseline must not target public objects.');
    await admin.query(baseline);
    const legacyId = randomUUID();
    await admin.query('INSERT INTO invoices (id, "updatedAt", "invoiceNo", "invoiceFy", status, "clientNameSnapshot") VALUES ($1, NOW(), 1, $2, $3, $4)', [legacyId, 'FY2026-27', 'FINALIZED', 'Legacy identity']);
    await admin.query(readFileSync('prisma/migrations/20261118130000_system_integrity_controls/migration.sql', 'utf8').replace(/^\uFEFF/, ''));
    const legacy = await admin.query('SELECT "customerSnapshot" FROM invoices WHERE id=$1', [legacyId]);
    assert.equal(legacy.rows[0].customerSnapshot.clientNameSnapshot, 'Legacy identity');
    console.log('PASS: additive migration and legacy invoice snapshot backfill');
  } catch (error) { await admin.query('ROLLBACK').catch(() => {}); throw error; } finally { await admin.query('RESET search_path'); admin.release(); }

  const owner = await prisma.user.create({ data: { email: 'owner@example.invalid', emailVerified: true, role: 'OWNER', name: 'Integration owner' } });
  const mocks = { '@/lib/prisma/db': { prisma, databaseSchema: schema }, '@/lib/check/permissions': { requirePermission: async () => ({ user: owner }) }, 'next/cache': { revalidatePath: () => {} } };
  const casting = await prisma.castingMaster.create({ data: { castingItemName: 'Isolated test casting' } });
  await prisma.stockBalance.create({ data: { castingMasterId: casting.id, qtyOnHand: 10, qtyAvailable: 10 } });
  const { postStockMovement } = load('src/lib/helpers/inventory/postStockMovement');
  const move = (qty, type = 'IN') => prisma.$transaction(tx => postStockMovement(tx, { castingMasterId: casting.id, movementType: type, referenceType: type === 'IN' ? 'CASTING_JOB' : 'MANUAL_ADJUSTMENT', referenceId: randomUUID(), qty }), { timeout: 20_000, maxWait: 20_000 });
  await Promise.all([move(5), move(7)]);
  assert.equal(Number((await prisma.stockBalance.findUniqueOrThrow({ where: { castingMasterId: casting.id } })).qtyOnHand), 22);
  const out = await Promise.allSettled([move(15, 'OUT'), move(15, 'OUT')]);
  assert.equal(out.filter(result => result.status === 'fulfilled').length, 1);
  const stock = await prisma.stockBalance.findUniqueOrThrow({ where: { castingMasterId: casting.id } });
  const ledger = await prisma.stockLedger.aggregate({ where: { castingMasterId: casting.id }, _sum: { qtyIn: true, qtyOut: true } });
  assert.equal(Number(stock.qtyOnHand), 7);
  assert.equal(10 + Number(ledger._sum.qtyIn) - Number(ledger._sum.qtyOut), Number(stock.qtyOnHand));
  console.log('PASS: real concurrent receipts, outbound availability and stock/ledger reconciliation');

  const draft = await prisma.invoice.create({ data: { invoiceNo: 2, invoiceFy: 'FY2026-27', draftVersion: 1, draftData: { header: {}, items: [], packages: [] } } });
  const { saveInvoiceDraftSnapshotAction: save } = load('src/lib/actions/dashboard/sales/invoice/saveInvoiceDraftSnapshotAction', mocks);
  const saves = await Promise.all(['first', 'second'].map(note => save({ invoiceId: draft.id, clientVersion: 1, draft: { header: { remarks: note }, items: [], packages: [] } })));
  assert.equal(saves.filter(result => result.ok).length, 1);
  assert.equal(saves.filter(result => result.code === 'VERSION_CONFLICT').length, 1);
  console.log('PASS: real simultaneous invoice autosaves accept exactly one expected version');

  const itemId = randomUUID();
  await prisma.invoice.update({ where: { id: draft.id }, data: { draftData: { header: { clientNameSnapshot: 'Issued identity', grandTotal: 1 }, items: [{ id: itemId, title: 'Test switch', isManual: true, salesOrderItemId: itemId, qty: 3, unitPrice: 100, lineGstTotal: -100, lineGrandTotal: 1 }], packages: [] } } });
  const { finalizeInvoiceAction } = load('src/lib/actions/dashboard/sales/invoice/finalizeInvoiceAction', mocks);
  const finalized = await finalizeInvoiceAction(draft.id);
  assert.equal(finalized.ok, true, finalized.message);
  const issued = await prisma.invoice.findUniqueOrThrow({ where: { id: draft.id }, include: { items: true } });
  assert.equal(Number(issued.grandTotal), 354); assert.equal(Number(issued.items[0].lineGrandTotal), 354);
  assert.equal(issued.customerSnapshot.clientNameSnapshot, 'Issued identity');
  assert.equal((await finalizeInvoiceAction(draft.id)).ok, false);
  console.log('PASS: invoice finalization recalculates money, captures identity and rejects duplicate finalization');

  const worker = await prisma.worker.create({ data: { code: 'INTEGRATION', name: 'Isolated worker' } });
  await prisma.workerLedgerEntry.create({ data: { workerId: worker.id, kind: 'ADVANCE', amount: 1000, date: new Date('2026-09-01T06:00:00Z'), createdById: owner.id } });
  for (const [month, amount] of [['09', 400], ['10', 300]]) await prisma.workEntry.create({ data: { workerId: worker.id, date: new Date('2026-' + month + '-02T06:00:00Z'), productNameSnapshot: 'Test product', operationNameSnapshot: 'Test operation', qty: 1, rate: amount, amount, createdById: owner.id } });
  const { settlePayoutAction } = load('src/lib/actions/dashboard/contractors/payouts/SettlePayout', mocks);
  for (const month of ['2026-09', '2026-10']) assert.equal((await settlePayoutAction({ workerId: worker.id, monthYear: month, applyAdvances: true, amountPaid: 0 })).ok, true);
  const payroll = await prisma.workerPayout.findUniqueOrThrow({ where: { workerId_monthYear: { workerId: worker.id, monthYear: '2026-10' } } });
  assert.equal(Number(payroll.carryForward), 300);
  const { createLedgerEntryAction } = load('src/lib/actions/dashboard/contractors/ledger/CreateLedgerEntry', mocks);
  const blocked = await createLedgerEntryAction({ workerId: worker.id, kind: 'ADVANCE', amount: 10, date: new Date('2026-09-15T06:00:00Z') });
  assert.equal(blocked.ok, false);
  console.log('PASS: payroll advance carry-forward and protection of settled periods');

  const headers = async () => new Headers({ 'x-real-ip': '192.0.2.50' });
  const { acceptWebsiteEnquiry } = load('src/lib/enquiries/accept', { ...mocks, 'next/headers': { headers }, '@/lib/email/outbox': { dispatchEmailOutbox: async () => ({ sent: 0 }) } });
  const input = { name: 'Fixture buyer', email: 'fixture@example.invalid', productInterest: 'Test switch', message: 'Please provide a quotation.', source: 'QUOTE_FORM' };
  const first = await acceptWebsiteEnquiry(input), second = await acceptWebsiteEnquiry(input);
  assert.equal(first.enquiryId, second.enquiryId);
  assert.equal(await prisma.websiteEnquiry.count(), 1); assert.equal(await prisma.emailOutbox.count(), 1);
  assert.equal(await prisma.quotation.count(), 0);
  const { dispatchEmailOutbox } = load('src/lib/email/outbox', { ...mocks, './nodemailer': { sendMail: async () => { throw new Error('SIMULATED_SMTP_DOWN'); } } });
  const mail = await prisma.emailOutbox.findFirstOrThrow();
  await dispatchEmailOutbox(mail.id);
  const pending = await prisma.emailOutbox.findUniqueOrThrow({ where: { id: mail.id } });
  assert.equal(pending.status, 'PENDING'); assert.equal(pending.attempts, 1); assert.ok(pending.nextAttemptAt > new Date());
  let deliveries = 0;
  const sender = load('src/lib/email/outbox', { ...mocks, './nodemailer': { sendMail: async () => { deliveries++; return { messageId: 'fixture-receipt' }; } } });
  await prisma.emailOutbox.update({ where: { id: mail.id }, data: { nextAttemptAt: new Date(0) } });
  await Promise.all([sender.dispatchEmailOutbox(mail.id), sender.dispatchEmailOutbox(mail.id)]);
  assert.equal(deliveries, 1); assert.equal((await prisma.emailOutbox.findUniqueOrThrow({ where: { id: mail.id } })).status, 'SENT');
  console.log('PASS: durable enquiry deduplication, no premature numbering, SMTP failure retry and a single claimed delivery');
}
main().catch(error => { console.error('FAIL:', String(error.message || error).split(url).join('<REDACTED>')); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect();
  if (created) { await pool.query('DROP SCHEMA ' + safeSchema() + ' CASCADE'); console.log('Removed isolated test schema.'); }
  await pool.end();
});
