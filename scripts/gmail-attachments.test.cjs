/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS matches the existing regression test loader. */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { NextRequest } = require('next/server');
const { load } = require('./test-loader.cjs');

const pdf = Buffer.from('%PDF-1.7\nfixture PDF');
const message = { id: 'gmail-message', threadId: 'thread', payload: { mimeType: 'multipart/mixed', parts: [
  { partId: '0', mimeType: 'text/plain', body: { data: Buffer.from('Body text').toString('base64url') } },
  { partId: '1', mimeType: 'multipart/mixed', parts: [
    { partId: '1.0', mimeType: 'application/pdf', filename: 'Purchase order.pdf', body: { attachmentId: 'gmail-attachment', size: pdf.length } },
    { partId: '1.1', mimeType: 'application/octet-stream', filename: 'DRAWING.PDF', body: { data: pdf.toString('base64url'), size: pdf.length } },
    { partId: '1.2', mimeType: 'text/html', filename: 'fake.pdf', body: { data: Buffer.from('<html>not a PDF</html>').toString('base64url') } },
  ] },
] } };

test('lists nested PDFs and generic PDF files without exposing body data or Gmail attachment IDs', () => {
  const { listGmailPdfs } = load('src/lib/gmail/attachments');
  assert.deepEqual(listGmailPdfs(message), [
    { partId: '1.0', filename: 'Purchase order.pdf', size: pdf.length },
    { partId: '1.1', filename: 'DRAWING.PDF', size: pdf.length },
  ]);
  assert.deepEqual(listGmailPdfs({ id: 'empty' }), []);
});

test('loads external attachment bytes only for a PDF part belonging to the selected message', async () => {
  const calls = [];
  const { getGmailPdf } = load('src/lib/gmail/attachments', { './google': { gmailGet: async (...args) => {
    calls.push(args); return { data: pdf.toString('base64url'), size: pdf.length };
  } } });
  assert.deepEqual(await getGmailPdf('access', message, '1.0'), { bytes: pdf, filename: 'Purchase order.pdf' });
  assert.deepEqual(calls, [['access', 'messages/gmail-message/attachments/gmail-attachment']]);
  await assert.rejects(getGmailPdf('access', message, '1.2'), error => error.status === 404);
  await assert.rejects(getGmailPdf('access', message, '9'), error => error.status === 404);
  assert.equal(calls.length, 1);
});

test('previews inline PDF bytes and root-level PDF messages without an attachment fetch', async () => {
  const { getGmailPdf } = load('src/lib/gmail/attachments', { './google': { gmailGet: () => assert.fail('No external attachment fetch expected') } });
  assert.deepEqual((await getGmailPdf('access', message, '1.1')).bytes, pdf);
  assert.deepEqual((await getGmailPdf('access', { id: 'root', payload: { mimeType: 'application/pdf', body: { data: pdf.toString('base64url') } } }, '0')).bytes, pdf);
});

test('rejects oversized and mislabeled PDFs before returning browser content', async () => {
  const { getGmailPdf, MAX_GMAIL_PDF_BYTES } = load('src/lib/gmail/attachments');
  await assert.rejects(getGmailPdf('access', { id: 'large', payload: { partId: '0', mimeType: 'application/pdf', body: { size: MAX_GMAIL_PDF_BYTES + 1 } } }, '0'), error => error.status === 413);
  await assert.rejects(getGmailPdf('access', { id: 'fake', payload: { partId: '0', mimeType: 'application/pdf', body: { data: Buffer.from('<html>fake</html>').toString('base64url') } } }, '0'), error => error.status === 415);
});

const id = 'e72271b3-935a-4f5b-83bb-81177ba65ebd';
function route({ found = true, denied = false, expired = false } = {}) {
  const queries = [], calls = [];
  const google = load('src/lib/gmail/google');
  const { GET } = load('src/app/api/gmail/notifications/[id]/attachments/route', {
    '@/lib/check/permissions': { requirePermission: async permission => {
      assert.equal(permission, 'sales.read');
      if (denied) throw new Error('Access denied');
      return { user: { id: 'owner' } };
    } },
    '@/lib/prisma/db': { prisma: { gmailNotification: { findFirst: async query => {
      queries.push(query); return found ? { messageId: 'gmail-message', connection: { encryptedRefreshToken: 'encrypted' } } : null;
    } } } },
    '@/lib/gmail/crypto': { decryptGmailSecret: secret => { assert.equal(secret, 'encrypted'); return 'refresh'; } },
    '@/lib/gmail/google': { ...google, exchangeGmailToken: async params => {
      calls.push(params); if (expired) throw new google.GmailApiError(401, 'invalid_grant'); return { access_token: 'access' };
    } },
    './google': { gmailGet: async (token, path) => {
      assert.equal(token, 'access'); calls.push(path);
      return path.includes('/attachments/') ? { data: pdf.toString('base64url') } : message;
    } },
  });
  return { queries, calls, get: (query = '', alertId = id) => GET(new NextRequest(`http://localhost/api/gmail/notifications/${alertId}/attachments${query}`), { params: Promise.resolve({ id: alertId }) }) };
}

test('attachment endpoint enforces sales access and private ownership before accessing Gmail', async () => {
  const missing = route({ found: false });
  const response = await missing.get('?partId=1.0');
  assert.equal(response.status, 404);
  assert.deepEqual(missing.queries[0].where, { id, userId: 'owner' });
  assert.equal(missing.calls.length, 0);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const denied = route({ denied: true });
  await assert.rejects(denied.get(), /Access denied/);
  assert.equal(denied.queries.length, 0);
});

test('attachment endpoint lists PDFs on demand and serves valid bytes inline without caching', async () => {
  const fixture = route();
  const list = await fixture.get();
  assert.equal(list.status, 200);
  assert.equal((await list.json()).attachments.length, 2);
  assert.equal(fixture.calls.length, 2, 'Listing must not fetch external attachment bytes');
  const preview = await fixture.get('?partId=1.0');
  assert.equal(preview.headers.get('Content-Type'), 'application/pdf');
  assert.match(preview.headers.get('Content-Disposition'), /^inline;/);
  assert.match(preview.headers.get('Content-Disposition'), /Purchase%20order.pdf/);
  assert.equal(preview.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(preview.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual(Buffer.from(await preview.arrayBuffer()), pdf);
});

test('invalid IDs and unknown attachment parts do not fetch arbitrary Gmail content', async () => {
  const fixture = route();
  assert.equal((await fixture.get('', 'not-an-id')).status, 400);
  assert.equal((await fixture.get('?partId=..%2Fother')).status, 400);
  assert.equal(fixture.queries.length, 0);
  assert.equal((await fixture.get('?partId=9')).status, 404);
  assert.equal(fixture.calls.filter(call => typeof call === 'string' && call.includes('/attachments/')).length, 0);
});

test('expired Gmail credentials produce a recoverable reconnect error without leaking upstream details', async () => {
  const fixture = route({ expired: true });
  const response = await fixture.get();
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Reconnect your mailbox/);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
