const assert = require('node:assert/strict');
const test = require('node:test');
const { load } = require('./test-loader.cjs');
const { productNameSearchTerms, rankSimilarProductNames } = load('src/lib/products/similarProductNames');

const product = (id, name, options = {}) => ({ id, kind: 'product', name, aliases: [], categoryId: 'lights', categoryName: 'Lighting', variantCount: 3, status: 'ACTIVE', ...options });
const catalog = [
  product('well', 'FLP/WP Well Glass Light Fitting', { aliases: ['FLP/WP Well Glass Fitting'] }),
  product('flood', 'FLP/WP Floodlight Fitting'),
  product('non-flp', 'Non-FLP Well Glass Light Fitting'),
  product('panel420', 'FLP/WP Panel Enclosure (420 × 420 mm)', { categoryId: 'panels' }),
  product('panel450', 'FLP/WP Panel Enclosure (450 × 450 mm)', { categoryId: 'panels' }),
];

test('default prefixes and generic words do not trigger catalog lookups', () => {
  for (const query of ['', 'FLP/WP ', 'Non-FLP', 'Product Fitting']) {
    assert.deepEqual(productNameSearchTerms(query), []);
    assert.deepEqual(rankSimilarProductNames(query, catalog), []);
  }
});

test('legacy names find the reviewed current name and show the matching alias', () => {
  const result = rankSimilarProductNames('  flp/wp WELL GLASS fitting ', catalog);
  assert.equal(result[0].id, 'well');
  assert.equal(result[0].name, 'FLP/WP Well Glass Light Fitting');
  assert.equal(result[0].matchedAlias, 'FLP/WP Well Glass Fitting');
  assert.equal(result[0].exact, true);
});

test('joined words, partial typing and small spelling mistakes find the correct family', () => {
  for (const query of ['wellglass', 'well gla', 'well glss']) {
    assert.equal(rankSimilarProductNames(query, catalog)[0].id, 'well', query);
  }
  assert.equal(rankSimilarProductNames('flood light', catalog)[0].id, 'flood');
});

test('protection and numeric specifications retain their distinctions', () => {
  assert.equal(rankSimilarProductNames('Non-FLP well glass', catalog)[0].id, 'non-flp');
  const panels = rankSimilarProductNames('420 panel', catalog);
  assert.equal(panels[0].id, 'panel420');
  assert.equal(panels.some(item => item.id === 'panel450'), false);
});

test('category improves ordering without hiding matching products in another category', () => {
  const options = [product('a', 'Cable Gland', { categoryId: 'one' }), product('b', 'Cable Gland', { categoryId: 'two' })];
  assert.deepEqual(rankSimilarProductNames('cable gland', options, 'two').map(item => item.id), ['b', 'a']);
  assert.equal(rankSimilarProductNames('unrelated equipment', catalog).length, 0);
  assert.equal(rankSimilarProductNames('cable gland', Array.from({ length: 10 }, (_, i) => product(String(i), 'Cable Gland'))).length, 5);
});

function setup({ error = false, denied = false } = {}) {
  let reads = 0;
  const prisma = {
    product: { findMany: async ({ where }) => {
      reads++;
      assert.equal(where.deletedAt, null);
      if (error) throw new Error('database unavailable');
      return [{ id: 'well', name: 'FLP/WP Well Glass Fitting', displayName: 'FLP/WP Well Glass Light Fitting', status: 'ACTIVE', categoryId: 'lights', category: { name: 'Lighting' }, _count: { variants: 9 } },
        { id: 'inactive', name: 'Well Glass Housing', displayName: null, status: 'INACTIVE', categoryId: 'lights', category: { name: 'Lighting' }, _count: { variants: 1 } }];
    } },
    productApprovalRequest: { findMany: async ({ where }) => {
      reads++;
      assert.equal(where.type, 'PRODUCT_CREATE');
      assert.equal(where.status, 'PENDING');
      return [{ id: 'pending', title: 'Well Glass Fitting', payload: { name: 'Well Glass Fitting', categoryId: 'lights', privateField: 'not returned' } }];
    } },
  };
  const { findSimilarProductNames } = load('src/lib/actions/dashboard/products/findSimilarProductNames', {
    '@/lib/prisma/db': { prisma },
    '@/lib/check/permissions': { requirePermission: async permission => { assert.equal(permission, 'master.read'); if (denied) throw new Error('permission denied'); } },
  });
  return { findSimilarProductNames, reads: () => reads };
}

test('real action returns existing and pending suggestions with current names and no request payload', async () => {
  const env = setup();
  const result = await env.findSimilarProductNames({ query: 'well glass' });
  assert.equal(result.ok, true);
  assert.equal(result.items.find(item => item.id === 'well').variantCount, 9);
  assert.equal(result.items.find(item => item.id === 'well').name, 'FLP/WP Well Glass Light Fitting');
  assert.equal(result.items.find(item => item.id === 'inactive').status, 'INACTIVE');
  assert.equal(result.items.find(item => item.id === 'pending').kind, 'pending');
  assert.equal(JSON.stringify(result).includes('privateField'), false);
});

test('empty, prefix-only and invalid requests do not read the database', async () => {
  const env = setup();
  await env.findSimilarProductNames({ query: 'FLP/WP ' });
  assert.equal((await env.findSimilarProductNames({ query: 'a'.repeat(181) })).ok, false);
  assert.equal(env.reads(), 0);
});

test('permission is enforced and query failures produce a recoverable result', async () => {
  const denied = setup({ denied: true });
  await assert.rejects(denied.findSimilarProductNames({ query: 'well glass' }), /permission denied/);
  assert.equal(denied.reads(), 0);
  assert.deepEqual(await setup({ error: true }).findSimilarProductNames({ query: 'well glass' }), { ok: false, items: [] });
});
