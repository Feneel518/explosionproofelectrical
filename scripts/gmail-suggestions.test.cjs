/* eslint-disable @typescript-eslint/no-require-imports -- Matches the existing regression test loader. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./test-loader.cjs');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { mailSearchHints, scoreSalesRecord, rankCatalogSuggestions, suggestExtractedProducts } = load('src/lib/gmail/suggestions');

const catalog = [
  { productId: 'well', variantId: '45', productName: 'FLP/WP Well Glass', variantName: 'LED 45W', sku: 'WG-045', typeNumber: 'FES/WG/80', rating: '45W' },
  { productId: 'well', variantId: '70', productName: 'FLP/WP Well Glass', variantName: 'LED 70W', sku: 'WG-070', typeNumber: 'FES/WG/80', rating: '70W' },
  { productId: 'flood', variantId: '100', productName: 'Flameproof Flood Light', variantName: 'LED 100W', sku: 'FL-100', typeNumber: 'FES/FL/100', rating: '100W' },
];

test('detects PO and purchase-document references automatically from subject and body', () => {
  for (const subject of ['PO No. HF/2026-00451', 'Purchase Document: HF/2026-00451', 'Purchase order number HF/2026-00451']) {
    assert.deepEqual(mailSearchHints(subject, 'Purchasing <buyer@harman.com>', '').poNumbers, ['HF/2026-00451']);
  }
  const hints = mailSearchHints('Material request', 'Jane <buyer@harman.com>', 'Customer: Harman Finochem Ltd\nPO: 4500012345');
  assert.ok(hints.nameWords.includes('finochem'));
  assert.equal(hints.email, 'buyer@harman.com');
  assert.deepEqual(hints.poNumbers, ['4500012345']);
  assert.deepEqual(mailSearchHints('PO #7', '', '').poNumbers, ['7']);
});

test('PO matches outrank name-only matches and tolerate punctuation changes', () => {
  const hints = mailSearchHints('Purchase order HF-2026-00451', 'Harman Finochem <buyer@harman.com>', '');
  const po = scoreSalesRecord({ poNumber: 'HF/2026/00451', clientName: 'Another billing name' }, hints);
  const name = scoreSalesRecord({ poNumber: 'unrelated', clientName: 'Harman Finochem Ltd' }, hints);
  assert.ok(po.score > name.score);
  assert.deepEqual(po.reasons, ['PO HF/2026/00451']);
  assert.equal(scoreSalesRecord({ poNumber: '451', clientName: 'Unrelated company' }, hints).score, 0);
});

test('matches sender email and saved customer/contact names without a PO', () => {
  const hints = mailSearchHints('Enquiry', 'Harman Finochem <buyer@harman.com>', '');
  assert.ok(scoreSalesRecord({ receivedFromEmail: 'BUYER@HARMAN.COM' }, hints).reasons.includes('Sender email'));
  assert.ok(scoreSalesRecord({ clientNameSnapshot: 'Harman Finochem Pvt Ltd' }, hints).score > 0);
  assert.equal(scoreSalesRecord({ clientName: 'Completely Different' }, hints).score, 0);
});

test('suggests actual variants by product description and excludes a conflicting wattage', () => {
  const items = rankCatalogSuggestions('FLP Wellglass light LED 45 W, quantity 10', catalog);
  assert.equal(items[0].variantId, '45');
  assert.ok(items[0].reasons.includes('Rating'));
  assert.ok(!items.some(item => item.variantId === '70'));
  assert.deepEqual(rankCatalogSuggestions('45W', catalog), [], 'A rating alone must not identify an unrelated product');
});

test('uses SKU/type numbers and retains alternatives when a type number is shared', () => {
  assert.equal(rankCatalogSuggestions('Please supply WG-070', catalog)[0].variantId, '70');
  assert.equal(rankCatalogSuggestions('Type FES/WG/80', catalog).length, 2);
  assert.deepEqual(rankCatalogSuggestions('WG-0700', catalog), [], 'A partial SKU must not be treated as an exact SKU');
});

test('supports current catalog display names and historical names', () => {
  const renamed = [{ ...catalog[0], productName: 'Wellglass Luminaire', productAliases: ['FLP/WP Well Glass'], variantName: '45W LED Luminaire', variantAliases: ['LED 45W'] }];
  assert.equal(rankCatalogSuggestions('FLP/WP Well Glass LED 45W', renamed)[0].productName, 'Wellglass Luminaire');
  assert.equal(rankCatalogSuggestions('Wellglass Luminaire 45W', renamed)[0].variantId, '45');
  assert.equal(rankCatalogSuggestions('Well Glass fitting 45W', renamed)[0].variantId, '45');
});

test('extracts multiple description rows and ignores greetings and unmatched text', () => {
  const rows = suggestExtractedProducts('Dear team\nFLP/WP Well Glass 45W Qty 10\nFlameproof Flood Light 100W Qty 4\nThanks', catalog);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].suggestions[0].variantId, '45');
  assert.equal(rows[1].suggestions[0].variantId, '100');
});

test('catalog retrieval includes active products and active variants with current labels', async () => {
  const { findMailProductSuggestions } = load('src/lib/gmail/suggestionService');
  let query;
  const rows = await findMailProductSuggestions({ product: { findMany: async input => {
    query = input;
    return [{ id: 'well', name: 'FLP/WP Well Glass', displayName: 'Wellglass Luminaire', variants: [{ id: '45', variant: 'LED 45W', displayName: '45W LED', sku: 'WG-045', typeNumber: 'FES/WG/80', rating: '45W' }] }];
  } } }, 'FLP/WP Well Glass 45W');
  assert.deepEqual(query.where, { deletedAt: null, status: 'ACTIVE' });
  assert.deepEqual(query.select.variants.where, { status: 'ACTIVE' });
  assert.equal(rows[0].suggestions[0].productName, 'Wellglass Luminaire');
  assert.equal(rows[0].suggestions[0].variantName, '45W LED');
});

test('sales suggestions search PO and customer fields and scope linked state to the mailbox owner', async () => {
  const { findMailSalesSuggestions } = load('src/lib/gmail/suggestionService');
  const queries = [];
  const order = { id: 'order', orderFy: 'FY2026-27', orderNo: 9, clientName: 'Harman Finochem', poNumber: '4500012345' };
  const db = {
    salesOrder: { findMany: async query => { queries.push(query); return [order]; } },
    quotation: { findMany: async query => { assert.equal(query.where.deletedAt, null); return [{ id: 'quote', quoteFy: 'FY2026-27', quoteNo: 8, clientName: 'Harman Finochem' }]; } },
    gmailThreadLink: { findMany: async query => { assert.deepEqual(query.where, { userId: 'owner', threadId: 'thread' }); return [{ salesOrderId: 'order' }]; } },
  };
  const result = await findMailSalesSuggestions(db, 'owner', 'thread', 'PO 4500012345', 'Harman Finochem', '');
  assert.equal(result.suggestions[0].id, 'order');
  assert.equal(result.suggestions[0].linked, true);
  assert.equal(result.suggestions.length, 2, 'Candidates found by both PO and name must be deduplicated');
  assert.ok(queries.some(query => query.where.OR.some(item => item.poNumber?.contains === '4500012345')));
  assert.ok(queries.every(query => query.where.deletedAt === null));
});

const notificationId = 'e72271b3-935a-4f5b-83bb-81177ba65ebd';
const recordId = 'e72271b3-935a-4f5b-83bb-81177ba65ebc';
function actionFixture({ found = true, denied = false, pdfBytes, failedGmail = false } = {}) {
  const calls = [];
  const alert = { messageId: 'private-message', threadId: 'private-thread', subject: 'PO 4500012345', sender: 'Harman Finochem', bodyText: null, connection: { encryptedRefreshToken: 'encrypted' } };
  const lookup = async query => { calls.push(['lookup', query]); return found ? alert : null; };
  const actions = load('src/lib/actions/dashboard/gmail/suggestionActions', {
    '@/lib/check/permissions': { requirePermission: async permission => { calls.push(['permission', permission]); if (denied) throw new Error('Denied'); return { user: { id: 'owner' } }; } },
    '@/lib/prisma/db': { prisma: { gmailNotification: { findFirst: lookup }, $transaction: async work => work({ gmailNotification: { findFirst: lookup } }) } },
    '@/lib/gmail/crypto': { decryptGmailSecret: () => 'refresh' },
    '@/lib/gmail/google': { GmailApiError: class extends Error {}, exchangeGmailToken: async () => { calls.push(['token']); if (failedGmail) throw new Error('Unavailable'); return { access_token: 'access' }; } },
    '@/lib/gmail/attachments': {
      getGmailAttachmentMessage: async (token, messageId) => { assert.equal(token, 'access'); assert.equal(messageId, 'private-message'); return { id: messageId }; },
      getGmailPdf: async (token, message, partId) => { assert.equal(token, 'access'); assert.equal(message.id, 'private-message'); assert.equal(partId, '1'); return { bytes: pdfBytes }; },
      listGmailPdfs: () => [{ partId: '1', filename: 'PO.pdf' }],
    },
    '@/lib/gmail/mime': { parseGmailMessage: () => ({ bodyText: 'FLP/WP Well Glass 45W' }) },
    '@/lib/gmail/suggestionService': {
      findMailSalesSuggestions: async (...args) => { calls.push(['sales', ...args.slice(1)]); return { suggestions: [], poNumbers: ['4500012345'] }; },
      findMailProductSuggestions: async (_db, text) => { calls.push(['products', text]); return suggestExtractedProducts(text, catalog); },
    },
    '@/lib/gmail/salesConversation': { linkSalesConversation: async (_tx, ...args) => calls.push(['link', ...args]) },
    '@/lib/security/submissionLimit': { consumeSubmissionLimit: async (...args) => calls.push(['limit', ...args]) },
  });
  return { actions, calls };
}

test('suggestion actions reject foreign/missing alerts and denied access before calling Gmail', async () => {
  for (const operation of [
    actions => actions.getGmailSuggestionsAction(notificationId),
    actions => actions.searchGmailSalesSuggestionsAction(notificationId, 'Harman'),
    actions => actions.extractGmailProductSuggestionsAction(notificationId, { text: 'Well Glass 45W' }),
    actions => actions.linkGmailSalesSuggestionAction(notificationId, 'ORDER', recordId),
  ]) {
    const missing = actionFixture({ found: false });
    await assert.rejects(operation(missing.actions), /Email not found/);
    assert.deepEqual(missing.calls[1][1].where, { id: notificationId, userId: 'owner' });
    assert.ok(!missing.calls.some(call => ['token', 'link', 'products', 'sales'].includes(call[0])));
    const denied = actionFixture({ denied: true });
    await assert.rejects(operation(denied.actions), /Denied/);
    assert.equal(denied.calls.length, 1);
  }
});

test('opening mail automatically matches its body, with subject/sender fallback if Gmail fails', async () => {
  const fixture = actionFixture();
  const result = await fixture.actions.getGmailSuggestionsAction(notificationId);
  assert.equal(result.products[0].suggestions[0].variantId, '45');
  assert.equal(result.attachments[0].filename, 'PO.pdf');
  const failed = actionFixture({ failedGmail: true });
  const fallback = await failed.actions.getGmailSuggestionsAction(notificationId);
  assert.ok(fallback.warning);
  assert.ok(failed.calls.some(call => call[0] === 'sales'));
});

test('linking requires write access and uses the owned conversation and validated target', async () => {
  const { actions, calls } = actionFixture();
  await actions.linkGmailSalesSuggestionAction(notificationId, 'ORDER', recordId);
  assert.deepEqual(calls[0], ['permission', 'sales.write']);
  assert.deepEqual(calls.at(-1), ['link', 'owner', 'private-thread', 'ORDER', recordId]);
  await assert.rejects(actions.linkGmailSalesSuggestionAction(notificationId, 'INVALID', recordId));
});

test('real PDF text extraction produces product/variant suggestions and searches its PO context', async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage();
  page.drawText('PO: 4500012345', { x: 40, y: 750, font, size: 12 });
  page.drawText('FLP/WP Well Glass 45W Qty 10', { x: 40, y: 700, font, size: 12 });
  const fixture = actionFixture({ pdfBytes: Buffer.from(await pdf.save()) });
  const result = await fixture.actions.extractGmailProductSuggestionsAction(notificationId, { partId: '1' });
  assert.equal(result.products[0].suggestions[0].variantId, '45');
  assert.ok(fixture.calls.some(call => call[0] === 'sales' && call[5].includes('4500012345')));
  assert.ok(fixture.calls.some(call => call[0] === 'limit'));
});

test('manual descriptions query the catalog without Gmail access; invalid PDF selectors are rejected', async () => {
  const fixture = actionFixture();
  const result = await fixture.actions.extractGmailProductSuggestionsAction(notificationId, { text: 'WG-070' });
  assert.equal(result.products[0].suggestions[0].variantId, '70');
  assert.ok(!fixture.calls.some(call => call[0] === 'token'));
  await assert.rejects(fixture.actions.extractGmailProductSuggestionsAction(notificationId, { partId: '../other' }));
  await assert.rejects(fixture.actions.extractGmailProductSuggestionsAction(notificationId, { partId: '1', text: 'WG-070' }));
});

test('PDFs without a text layer show a paste-description fallback instead of treating page labels as content', async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const fixture = actionFixture({ pdfBytes: Buffer.from(await pdf.save()) });
  const result = await fixture.actions.extractGmailProductSuggestionsAction(notificationId, { partId: '1' });
  assert.deepEqual(result.products, []);
  assert.match(result.warning, /no readable text/);
});
