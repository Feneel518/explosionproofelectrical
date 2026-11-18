const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./test-loader.cjs');
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'feneelp@gmail.com', emailVerified: true };
const auth = { requireAuth: async () => ({ user }) };
const permissions = { requirePermission: async () => ({ user }) };
function meetTwo() {
  let count = 0, release;
  const ready = new Promise(resolve => { release = resolve; });
  return async () => { if (++count === 2) release(); await ready; };
}
test('concurrent stock receipts preserve both quantities and ledger balances', async () => {
  let unlock;
  const firstLock = new Promise(resolve => { unlock = resolve; });
  let lockCalls = 0;
  const rendezvous = meetTwo();
  const balance = { id: 'balance', qtyOnHand: 10, qtyReserved: 0 };
  const ledger = [];
  function transaction() {
    let locked = false;
    return {
      $executeRaw: async () => { locked = true; if (++lockCalls === 2) await firstLock; return []; },
      inventorySetting: { findUnique: async () => ({ allowNegativeStock: false }) },
      stockBalance: {
        findFirst: async () => { const snapshot = { ...balance }; if (!locked) await rendezvous(); return snapshot; },
        update: async ({ data }) => Object.assign(balance, data),
      },
      stockLedger: { create: async ({ data }) => { ledger.push(data); if (locked) unlock(); } },
    };
  }
  const { postStockMovement } = load('src/lib/helpers/inventory/postStockMovement');
  await Promise.all([5, 7].map(qty => postStockMovement(transaction(), { castingMasterId: 'casting', movementType: 'IN', referenceType: 'CASTING_JOB', referenceId: `job-${qty}`, qty })));
  assert.equal(balance.qtyOnHand, 22);
  assert.equal(ledger.reduce((sum, row) => sum + row.qtyIn, 0), 12);
  assert.equal(ledger.at(-1).balanceAfter, 22);
});
test('two autosaves with the same version yield one save and one conflict', async () => {
  const rendezvous = meetTwo();
  const invoice = { id: user.id, status: 'DRAFT', draftVersion: 1 };
  const prisma = { invoice: {
    findUnique: async () => { const snapshot = { ...invoice }; await rendezvous(); return snapshot; },
    update: async ({ where, data }) => {
      if ((where.draftVersion !== undefined && where.draftVersion !== invoice.draftVersion) || (where.status && where.status !== invoice.status)) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
      invoice.draftData = data.draftData; invoice.draftVersion += data.draftVersion.increment;
      return { draftVersion: invoice.draftVersion, updatedAt: new Date() };
    },
  } };
  const { saveInvoiceDraftSnapshotAction: save } = load('src/lib/actions/dashboard/sales/invoice/saveInvoiceDraftSnapshotAction', {
    '@/lib/check/requireAuth': auth, '@/lib/check/permissions': permissions, '@/lib/prisma/db': { prisma },
  });
  const draft = { header: { invoiceDate: '2026-11-18', subtotal: 999, gstTotal: 999, grandTotal: 999 }, items: [], packages: [] };
  const results = await Promise.all([1, 2].map(note => save({ invoiceId: user.id, clientVersion: 1, draft: { ...draft, note } })));
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.filter(result => result.code === 'VERSION_CONFLICT').length, 1);
});

test('sensitive analytics actions reject unauthorized callers before querying data', async () => {
  for (const [file, name] of [
    ['getDashboardOverviewAction', 'getDashboardOverviewAction'], ['getDashboardMonthlyTrendsAction', 'getDashboardMonthlyTrendsAction'],
    ['getWebsiteVisitorAnalyticsAction', 'getWebsiteVisitorAnalyticsAction'], ['sales/order/analytics/getOrderDashboardAnalytics', 'getOrderDashboardAnalytics'],
  ]) {
    const actions = load('src/lib/actions/dashboard/' + file, { '@/lib/prisma/db': { prisma: {} }, '@/lib/check/permissions': { requirePermission: async () => { throw new Error('FORBIDDEN'); } } });
    await assert.rejects(actions[name](), /FORBIDDEN/);
  }
});
test('generic auth email utility is internal, with no exported Server Action module', () => {
  const fs = require('node:fs');
  assert.equal(fs.existsSync('src/lib/actions/emails/send-emails.action.ts'), false);
  const source = fs.readFileSync('src/lib/email/sendAuthEmail.ts', 'utf8');
  assert.ok(source.includes('import "server-only"'));
  assert.ok(!source.includes('"use server"'));
});
test('staff permissions deny financial changes and explicit owner configuration replaces the legacy owner', () => {
  const { hasPermission } = load('src/lib/check/permissionPolicy');
  const original = { ...process.env };
  try {
    process.env.DASHBOARD_OWNER_EMAILS = 'owner@example.com';
    process.env.INVENTORY_STOREKEEPER_EMAILS = 'stores@example.com';
    process.env.ACCOUNTS_EMAILS = 'accounts@example.com';
    assert.equal(hasPermission({ email: 'feneelp@gmail.com', emailVerified: true }, 'accounts.write'), false);
    assert.equal(hasPermission({ email: 'stores@example.com', emailVerified: true }, 'inventory.write'), true);
    assert.equal(hasPermission({ email: 'stores@example.com', emailVerified: true }, 'inventory.manage'), false);
    assert.equal(hasPermission({ email: 'stores@example.com', emailVerified: true }, 'accounts.write'), false);
    assert.equal(hasPermission({ email: 'accounts@example.com', emailVerified: true }, 'master.read'), true);
    assert.equal(hasPermission({ email: 'owner@example.com', emailVerified: false }, 'accounts.write'), false);
    assert.equal(hasPermission({ email: 'owner@example.com', emailVerified: true }, 'accounts.write'), true);
  } finally { process.env = original; }
});
test('supplier links require the right token, eligible status and unexpired grant; revocation and replacement invalidate old links', () => {
  const { issuePurchaseOrderShare, validPurchaseOrderShare } = load('src/lib/purchase/sharing');
  const now = new Date('2026-11-18T00:00:00Z');
  const first = issuePurchaseOrderShare(now), second = issuePurchaseOrderShare(now);
  const order = { status: 'SENT', shareTokenHash: first.hash, shareExpiresAt: first.expiresAt };
  assert.equal(validPurchaseOrderShare(order, first.token, now), true);
  assert.equal(validPurchaseOrderShare(order, second.token, now), false);
  assert.equal(validPurchaseOrderShare({ ...order, status: 'DRAFT' }, first.token, now), false);
  assert.equal(validPurchaseOrderShare(order, first.token, new Date('2026-12-01')), false);
  assert.equal(validPurchaseOrderShare({ ...order, shareTokenHash: null }, first.token, now), false);
  assert.equal(validPurchaseOrderShare({ ...order, shareTokenHash: second.hash }, first.token, now), false);
});
test('invoice finalization ignores tampered line/header totals and rejects invalid money', () => {
  const { normalizeInvoiceDraft } = load('src/lib/invoices/draft');
  const draft = { header: { grandTotal: 1, gstTotal: -100 }, items: [{ title: 'Switch', qty: 3, unitPrice: 100, lineGstTotal: 0, lineGrandTotal: 1 }], packages: [] };
  const result = normalizeInvoiceDraft(draft, 'CGST_SGST_18', true);
  assert.equal(result.header.subtotal, 300); assert.equal(result.header.gstTotal, 54); assert.equal(result.header.grandTotal, 354);
  assert.equal(result.items[0].lineGrandTotal, 354);
  assert.throws(() => normalizeInvoiceDraft({ ...draft, items: [{ title: 'x', qty: -1, unitPrice: 100 }] }, undefined, true));
  assert.throws(() => normalizeInvoiceDraft({ ...draft, items: [{ title: 'x', qty: 1, unitPrice: Infinity }] }, undefined, true));
  assert.throws(() => normalizeInvoiceDraft({ ...draft, items: [] }, undefined, true));
});
test('invoice calculations use exact paise and configured tax rates', () => {
  const { calculateInvoiceAmounts: calculate } = load('src/lib/invoices/amounts');
  assert.equal(calculate([{ qty: 1, unitPrice: 1.005 }], 'IGST_0_SEZ').grandTotal, 1.01);
  assert.equal(calculate([{ qty: 0.1, unitPrice: 0.2 }], 'IGST_0_SEZ').grandTotal, 0.02);
  assert.equal(calculate([{ qty: 1, unitPrice: 100 }], 'IGST_5').grandTotal, 105);
  assert.equal(calculate([{ qty: 1, unitPrice: 100 }], 'IGST_0_1').grandTotal, 100.1);
});
test('captured invoice identity survives a later master-data change', async () => {
  const { captureInvoiceCustomerSnapshot, readInvoiceCustomerSnapshot } = load('src/lib/invoices/customerSnapshot');
  const customer = { companyName: 'Original company', city: 'Vapi', state: 'Gujarat', gstin: null, addressLine1: 'Original address', addressLine2: null, country: 'India', pincode: '396195', companyPhone: '123', companyEmail: 'buyer@example.com' };
  const tx = { customer: { findUnique: async () => customer } };
  const snapshot = await captureInvoiceCustomerSnapshot(tx, 'customer', null, { clientNameSnapshot: 'Original company' });
  customer.companyName = 'Changed'; customer.addressLine1 = 'Changed address';
  const stored = readInvoiceCustomerSnapshot(JSON.parse(JSON.stringify(snapshot)));
  assert.equal(stored.companyNameSnapshot, 'Original company'); assert.equal(stored.addressLine1, 'Original address');
});

test('payroll preview uses outstanding advances, unpaid wages and India month boundaries', () => {
  const { calculatePayoutAmounts, payrollMonthBounds } = load('src/lib/contractors/payoutAmounts');
  const inputs = { earnings: 500, bonus: 25, deductions: 50, lifetimeAdvances: 1000, priorAdvanceApplied: 700, priorUnpaidWages: 100, applyAdvances: true };
  const amounts = calculatePayoutAmounts(inputs);
  assert.equal(Number(amounts.advances), 300);
  assert.equal(Number(amounts.netPayable), 275);
  assert.equal(Number(calculatePayoutAmounts({ ...inputs, applyAdvances: false }).netPayable), 575);
  const bounds = payrollMonthBounds('2026-11');
  assert.equal(bounds.start.toISOString(), '2026-10-31T18:30:00.000Z');
  assert.equal(bounds.end.toISOString(), '2026-11-30T18:30:00.000Z');
  assert.throws(() => payrollMonthBounds('2026-13'), /valid payroll month/);
});

test('authorization reads the current database role and rejects revoked or unverified users', async () => {
  let current = { ...user, role: 'STAFF', emailVerified: true };
  const { requireAuth } = load('src/lib/check/requireAuth', {
    '../auth/session': { getAuthSession: async () => ({ user: { ...user, role: 'ADMIN' } }) },
    '@/lib/prisma/db': { prisma: { user: { findUnique: async () => current } } },
    './dashboardAccess': { isDashboardEmailAllowed: email => email === user.email },
    'next/navigation': { redirect: url => { throw new Error('REDIRECT:' + url); }, unstable_rethrow: () => {} },
  });
  assert.equal((await requireAuth()).user.role, 'STAFF');
  current = { ...current, emailVerified: false };
  await assert.rejects(requireAuth(), /REDIRECT:\/auth\/login/);
  current = { ...current, emailVerified: true, email: 'revoked@example.invalid' };
  await assert.rejects(requireAuth(), /REDIRECT:\/auth\/login/);
});
function payrollFixture() {
  const { Prisma } = require('@prisma/client');
  const state = { payouts: [], ledger: [], advances: 1000, earnings: 400, failLedger: false };
  const tx = {
    $executeRaw: async () => [], worker: { findFirst: async () => ({ id: user.id }) },
    workEntry: { aggregate: async () => ({ _sum: { amount: state.earnings } }) },
    castingJobReceiptItem: { aggregate: async () => ({ _sum: { laborAmount: 0 } }) },
    workerLedgerEntry: {
      aggregate: async () => ({ _sum: { amount: state.advances } }), findMany: async () => [],
      create: async ({ data }) => { if (state.failLedger) throw new Error('LEDGER_FAILURE'); state.ledger.push(data); },
    },
    workerPayout: {
      findUnique: async ({ where }) => state.payouts.find(row => row.monthYear === where.workerId_monthYear.monthYear) || null,
      findFirst: async ({ where }) => state.payouts.filter(row => where.monthYear.gt ? row.monthYear > where.monthYear.gt : row.monthYear < where.monthYear.lt).sort((a, b) => b.monthYear.localeCompare(a.monthYear))[0] || null,
      aggregate: async ({ where }) => ({ _sum: { advanceApplied: state.payouts.filter(row => row.monthYear < where.monthYear.lt).reduce((sum, row) => sum.plus(row.advanceApplied), new Prisma.Decimal(0)) } }),
      upsert: async ({ create, update }) => { const index = state.payouts.findIndex(row => row.monthYear === create.monthYear); const row = index < 0 ? { id: String(state.payouts.length), ...create } : { ...state.payouts[index], ...update }; if (index < 0) state.payouts.push(row); else state.payouts[index] = row; return { id: row.id }; },
    },
  };
  const withSerializableRetry = async operation => {
    const before = { payouts: [...state.payouts], ledger: [...state.ledger] };
    try { return await operation(tx); } catch (error) { state.payouts = before.payouts; state.ledger = before.ledger; throw error; }
  };
  const { settlePayoutAction } = load('src/lib/actions/dashboard/contractors/payouts/SettlePayout', {
    '@/lib/check/permissions': permissions, '@/lib/prisma/withSerializableRetry': { withSerializableRetry }, 'next/cache': { revalidatePath: () => {} },
  });
  return { state, settle: (monthYear, amountPaid = 0, applyAdvances = true) => settlePayoutAction({ workerId: user.id, monthYear, amountPaid, applyAdvances }) };
}
test('payroll keeps excess and deferred advances across months', async () => {
  const first = payrollFixture();
  assert.equal((await first.settle('2026-10')).ok, true);
  assert.equal(Number(first.state.payouts[0].carryForward), 600);
  first.state.earnings = 300;
  assert.equal((await first.settle('2026-11')).ok, true);
  assert.equal(Number(first.state.payouts[1].carryForward), 300);
  const deferred = payrollFixture();
  assert.equal((await deferred.settle('2026-10', 0, false)).ok, true);
  assert.equal(Number(deferred.state.payouts[0].carryForward), 1000);
  assert.equal(Number(deferred.state.payouts[0].unpaidWagesForward), 400);
});
test('payout and ledger roll back together; payment retries do not duplicate or erase history', async () => {
  const env = payrollFixture(); env.state.advances = 0; env.state.earnings = 1000; env.state.failLedger = true;
  assert.equal((await env.settle('2026-11', 250)).ok, false);
  assert.equal(env.state.payouts.length, 0); assert.equal(env.state.ledger.length, 0);
  env.state.failLedger = false;
  assert.equal((await env.settle('2026-11', 250)).ok, true);
  assert.equal((await env.settle('2026-11', 250)).ok, true); assert.equal(env.state.ledger.length, 1);
  assert.equal((await env.settle('2026-11', 100)).ok, false); assert.equal(env.state.ledger.length, 1);
  assert.equal(Number(env.state.payouts[0].amountPaid), 250);
});
test('invalid payroll months, overpayment and changing an earlier settled month are blocked', async () => {
  const env = payrollFixture(); env.state.advances = 0;
  assert.equal((await env.settle('2026-13')).ok, false);
  assert.equal((await env.settle('2026-11', 401)).ok, false);
  assert.equal((await env.settle('2026-11')).ok, true);
  assert.equal((await env.settle('2026-10')).ok, false);
});

test('invoice discounts reconcile to line amounts and cannot exceed the subtotal', () => {
  const { calculateInvoiceAmounts: calculate } = load('src/lib/invoices/amounts');
  const result = calculate([{ qty: 1, unitPrice: 100 }, { qty: 1, unitPrice: 200 }], 'IGST_18', { type: 'PERCENTAGE', value: 10 });
  assert.equal(result.discountTotal, 30); assert.equal(result.taxableTotal, 270); assert.equal(result.gstTotal, 48.6); assert.equal(result.grandTotal, 318.6);
  assert.equal(result.items.reduce((sum, item) => sum + item.lineGrandTotal, 0), result.grandTotal);
  assert.throws(() => calculate([{ qty: 1, unitPrice: 100 }], 'IGST_18', { type: 'AMOUNT', value: 101 }));
});
test('settled payroll periods and direct payment-history mutations are blocked', async () => {
  const { assertPayrollPeriodOpen } = load('src/lib/contractors/periodLock');
  const tx = { $executeRaw: async () => 1, workerPayout: { findFirst: async () => ({ monthYear: '2026-11' }) } };
  await assert.rejects(assertPayrollPeriodOpen(tx, user.id, new Date('2026-10-10')), /settled/);
  const { createLedgerEntryAction } = load('src/lib/actions/dashboard/contractors/ledger/CreateLedgerEntry', { '@/lib/check/permissions': permissions, 'next/cache': { revalidatePath: () => {} }, '@/lib/prisma/db': { prisma: {} } });
  assert.equal((await createLedgerEntryAction({ workerId: user.id, date: new Date(), kind: 'PAYOUT', amount: 100 })).ok, false);
});
test('unverified products do not publish invented Ex markings or certified zones', () => {
  const { toCatalogProductDetail, formatGasGroupLabel } = load('src/lib/marketing/catalog', { '@/lib/prisma/db': { prisma: {} } });
  const row = { name: 'Test', slug: 'test', flpType: null, protection: null, gasGroup: 'IIA, IIB', zones: ['Zone-0'], material: null, categoryId: user.id, category: { id: user.id, name: 'Test', slug: 'test' }, variants: [] };
  const data = toCatalogProductDetail(row);
  assert.ok(!formatGasGroupLabel(row.gasGroup).includes('Ex d'));
  assert.equal(data.group, ''); assert.deepEqual(data.zones, []); assert.equal(data.gasGroup, null);
  const verified = toCatalogProductDetail({ ...row, certificationMarking: 'Exact certificate marking', certificationReference: 'Certificate revision 1', certificationVerifiedAt: new Date() });
  assert.equal(verified.group, 'Exact certificate marking');
});
