const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./test-loader.cjs');

test('an existing default filter is upgraded and rescanned for Purchase Doc emails', async () => {
  const { DEFAULT_GMAIL_QUERY, buildGmailSearch } = load('src/lib/gmail/google');
  const oldQuery = 'in:inbox -in:sent {subject:order subject:"purchase order" subject:inquiry subject:enquiry subject:RFQ subject:quotation subject:"quote request"}';
  const now = new Date();
  const current = { userId: 'fixture-owner', searchQuery: oldQuery, connectedAt: now, lastSyncedAt: now, lastSyncAttemptAt: now, syncLeaseUntil: null, encryptedRefreshToken: 'fixture' };
  const imported = [], searched = [];
  const updates = async ({ where, data }) => {
    if (where.searchQuery && where.searchQuery !== current.searchQuery) return { count: 0 };
    Object.assign(current, data); return { count: 1 };
  };
  const { syncGmail } = load('src/lib/gmail/sync', {
    '@/lib/prisma/db': { prisma: {
      gmailConnection: { findUnique: async () => ({ ...current }), updateMany: updates },
      gmailNotification: { findMany: async () => [] },
      $transaction: async work => work({ gmailConnection: { updateMany: updates }, gmailNotification: { createMany: async ({ data }) => imported.push(...data) } }),
    } },
    './crypto': { decryptGmailSecret: () => 'fixture-refresh' },
    './google': { ...load('src/lib/gmail/google'), exchangeGmailToken: async () => ({ access_token: 'fixture-access' }) },
    './messages': { getMatchingGmailMessages: async (_token, query) => {
      searched.push(query);
      return { complete: true, messages: query.includes('subject:"purchase doc"') ? [{ messageId: 'fixture-harman', threadId: 'fixture-thread', subject: 'Harman Finochem Purchase Doc 4830002545 / 2100', sender: 'Purchase department <buyer@example.invalid>', receivedAt: new Date() }] : [] };
    } },
  });
  await syncGmail('fixture-owner');
  assert.equal(imported.length, 1, 'A recent checkpoint must not hide earlier Purchase Doc mail after the default changes');
  assert.equal(current.searchQuery, DEFAULT_GMAIL_QUERY);
  assert.match(current.searchQuery, /subject:"purchase doc"/);
  assert.equal(searched[0], buildGmailSearch(DEFAULT_GMAIL_QUERY, null, new Date(current.lastSyncedAt)));
});

test('imported mail beyond the first 100 alerts remains reachable on the next page', async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    id: `alert-${index}`, userId: 'fixture-owner', subject: `Enquiry ${index}`, sender: 'buyer@example.invalid',
    threadId: `thread-${index}`, receivedAt: new Date(Date.UTC(2026, 10, 18, 12, 0, -index)),
    createdAt: new Date('2026-11-18T12:00:00Z'), readAt: null,
  }));
  const { getGmailInboxAction } = load('src/lib/actions/dashboard/gmail/inboxActions', {
    '@/lib/check/permissions': { requirePermission: async () => ({ user: { id: 'fixture-owner' } }) },
    '@/lib/gmail/google': { gmailIsConfigured: () => false, DEFAULT_GMAIL_QUERY: 'subject:enquiry' },
    '@/lib/gmail/sync': { syncGmail: async () => {} },
    '@/lib/prisma/db': { prisma: {
      gmailConnection: { findUnique: async () => null },
      gmailNotification: {
        findMany: async ({ where, skip = 0, take }) => rows.filter(row => row.userId === where.userId).slice(skip, skip + take),
        count: async () => rows.length,
      },
    } },
  });
  const page = await getGmailInboxAction({ page: 2 });
  assert.equal(page.notifications.length, 1);
  assert.equal(page.notifications[0].id, 'alert-100');
});

test('quoted date-like text does not disable the initial safety window', () => {
  const { buildGmailSearch } = load('src/lib/gmail/google');
  const now = new Date('2026-11-18T12:00:00Z');
  assert.equal(buildGmailSearch('subject:"before: deadline"', null, now), `(subject:"before: deadline") after:${Math.floor(now.getTime() / 1000) - 30 * 86400}`);
});

test('forced refresh rechecks the saved query even immediately after an incremental sync', async () => {
  const { buildGmailSearch } = load('src/lib/gmail/google');
  const now = new Date();
  const queries = [];
  const claims = [];
  const connection = { connectedAt: now, lastSyncedAt: now, searchQuery: 'subject:enquiry after:2025/01/01 before:2025/02/01', encryptedRefreshToken: 'fixture', syncLeaseUntil: null };
  const updates = async args => { claims.push(args); return { count: 1 }; };
  const { syncGmail } = load('src/lib/gmail/sync', {
    '@/lib/prisma/db': { prisma: { gmailConnection: { findUnique: async () => connection, updateMany: updates }, gmailNotification: { findMany: async () => [] }, $transaction: async work => work({ gmailConnection: { updateMany: updates } }) } },
    './crypto': { decryptGmailSecret: () => 'fixture-refresh-token' },
    './google': { ...load('src/lib/gmail/google'), buildGmailSearch, exchangeGmailToken: async () => ({ access_token: 'fixture-access' }) },
    './messages': { getMatchingGmailMessages: async (_token, query) => { queries.push(query); return { messages: [], complete: true }; } },
  });
  await syncGmail('fixture-owner');
  assert.equal(queries.length, 0);
  await syncGmail('fixture-owner', { rescan: true });
  assert.deepEqual(queries, [`(${connection.searchQuery})`]);
  assert.equal(claims[0].where.searchQuery, connection.searchQuery);
  assert.equal(claims[0].where.lastSyncedAt, now);
});

test('custom Gmail queries are preserved and a concurrent edit cancels the default upgrade', async () => {
  const google = load('src/lib/gmail/google');
  const custom = 'in:inbox from:buyer@example.invalid subject:invoice';
  assert.equal(google.upgradeDefaultGmailQuery(custom), custom);
  let networkCalls = 0, updates = 0;
  const { syncGmail } = load('src/lib/gmail/sync', {
    '@/lib/prisma/db': { prisma: { gmailConnection: {
      findUnique: async () => ({ connectedAt: new Date(), searchQuery: google.LEGACY_DEFAULT_GMAIL_QUERY, lastSyncedAt: new Date(), encryptedRefreshToken: 'fixture' }),
      updateMany: async ({ where, data }) => { updates++; assert.equal(where.searchQuery, google.LEGACY_DEFAULT_GMAIL_QUERY); assert.equal(data.lastSyncedAt, null); return { count: 0 }; },
    } } },
    './google': { ...google, exchangeGmailToken: async () => { networkCalls++; } },
    './crypto': {}, './messages': {},
  });
  await syncGmail('fixture-owner');
  assert.equal(updates, 1); assert.equal(networkCalls, 0);
});

test('history search reaches older subject/sender matches and always stays scoped to the signed-in user', async () => {
  const rows = [
    { id: 'mine', userId: 'fixture-owner', subject: 'Archived motor enquiry', sender: 'Customer <buyer@example.invalid>', threadId: 'mine', receivedAt: new Date(), createdAt: new Date(), readAt: null },
    { id: 'other', userId: 'other-owner', subject: 'Archived motor enquiry', sender: 'buyer@example.invalid', threadId: 'other', receivedAt: new Date(), createdAt: new Date(), readAt: null },
  ];
  const queryRows = where => rows.filter(row => row.userId === where.userId && (!where.OR || where.OR.some(clause => Object.entries(clause).some(([field, rule]) => row[field].toLowerCase().includes(rule.contains.toLowerCase())))));
  const { getGmailAlertsAction } = load('src/lib/actions/dashboard/gmail/inboxActions', {
    '@/lib/check/permissions': { requirePermission: async () => ({ user: { id: 'fixture-owner' } }) },
    '@/lib/gmail/google': {}, '@/lib/gmail/sync': {},
    '@/lib/prisma/db': { prisma: { gmailNotification: {
      count: async ({ where }) => queryRows(where).length,
      findMany: async ({ where, take, skip }) => queryRows(where).slice(skip, skip + take),
    } } },
  });
  const result = await getGmailAlertsAction({ search: 'BUYER@', page: 999 });
  assert.deepEqual(result.notifications.map(row => row.id), ['mine']);
  assert.deepEqual(result.pagination, { page: 1, pageSize: 100, total: 1, totalPages: 1 });
  assert.equal((await getGmailAlertsAction({ search: 'not present' })).pagination.total, 0);
  await assert.rejects(getGmailAlertsAction({ page: -1 }));
});

test('an explicit Gmail date range is not silently restricted to the last 30 days', () => {
  const { buildGmailSearch } = load('src/lib/gmail/google');
  const query = 'subject:enquiry after:2025/01/01 before:2025/02/01';
  assert.equal(buildGmailSearch(query, null, new Date('2026-11-18T12:00:00Z')), `(${query})`);
});

test('the bell can preview unread mail even when it is older than the first page', async () => {
  const rows = Array.from({ length: 101 }, (_, index) => ({
    id: `alert-${index}`, userId: 'fixture-owner', subject: `Enquiry ${index}`, sender: 'buyer@example.invalid', threadId: `thread-${index}`,
    receivedAt: new Date(Date.UTC(2026, 10, 18, 12, 0, -index)), createdAt: new Date(), readAt: index === 100 ? null : new Date(),
  }));
  const matching = where => rows.filter(row => row.userId === where.userId && (where.readAt === null ? row.readAt === null : true));
  const { getGmailInboxAction } = load('src/lib/actions/dashboard/gmail/inboxActions', {
    '@/lib/check/permissions': { requirePermission: async () => ({ user: { id: 'fixture-owner' } }) },
    '@/lib/gmail/google': { gmailIsConfigured: () => false }, '@/lib/gmail/sync': {},
    '@/lib/prisma/db': { prisma: { gmailConnection: { findUnique: async () => null }, gmailNotification: {
      count: async ({ where }) => matching(where).length,
      findMany: async ({ where, skip = 0, take }) => matching(where).slice(skip, skip + take),
    } } },
  });
  const result = await getGmailInboxAction();
  assert.equal(result.unreadCount, 1);
  assert.deepEqual(result.unreadPreview?.map(row => row.id) ?? [], ['alert-100']);
});
