/* eslint-disable @typescript-eslint/no-require-imports, @next/next/no-assign-module-variable */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Execute the real server actions with isolated auth, cache, email and database boundaries.
function load(relative, mocks, cache = new Map()) {
  const filename = ['.ts', '.tsx', ''].map(ext => path.resolve(relative + ext)).find(fs.existsSync);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const localRequire = id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('@/')) return load('src/' + id.slice(2), mocks, cache);
    if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id), mocks, cache);
    return require(id);
  };
  new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
  return module.exports;
}

const id = '11111111-1111-4111-8111-111111111111';
const product = { name: 'Test light', slug: 'test-light', categoryId: id, zones: ['1'] };
const variant = { productId: id, variant: '100W', sku: 'TEST-100' };
function setup(type = 'PRODUCT_CREATE', payload = product) {
  const state = { request: { id, type, payload, status: 'PENDING' }, products: [], variants: [], submissions: [], parent: true };
  state.user = { id, email: 'feneelp@gmail.com', emailVerified: true };
  const prisma = {
    productApprovalSettings: { upsert: async () => ({ approvalEmail: 'feneelp@gmail.com', sendEmailNotifications: false }) },
    productApprovalRequest: {
      findUnique: async () => ({ ...state.request }),
      create: async ({ data }) => { state.submissions.push(data); return { id, ...data }; },
      updateMany: async ({ where, data }) => {
        if (state.request.status !== where.status) return { count: 0 };
        Object.assign(state.request, data);
        return { count: 1 };
      },
      update: async ({ data }) => Object.assign(state.request, data),
    },
    product: {
      findFirst: async () => state.parent ? { id, name: 'Test light' } : null,
      create: async ({ data }) => { state.products.push(data); return { id }; },
    },
    productVariant: { create: async ({ data }) => { state.variants.push(data); return { id }; } },
    $transaction: async callback => {
      const before = structuredClone(state);
      try { return await callback(prisma); }
      catch (error) { Object.assign(state, before); throw error; }
    },
  };
  const mocks = {
    '@/lib/prisma/db': { prisma },
    '@/lib/check/requireAuth': { requireAuth: async () => ({ user: state.user }) },
    './requireAuth': { requireAuth: async () => ({ user: state.user }) },
    'next/navigation': { redirect: destination => { throw new Error('REDIRECT:' + destination); } },
    'next/cache': { revalidatePath: () => {} },
    '@/lib/products/approvalEmail': { sendProductApprovalEmail: async () => ({ error: null }) },
  };
  return { state, prisma, mocks, actions: () => load('src/lib/actions/superadmin/productApprovalActions', mocks) };
}

for (const [type, payload, filename, action, collection] of [
  ['PRODUCT_CREATE', product, 'CreateProduct', 'createProductAction', 'products'],
  ['VARIANT_CREATE', variant, 'CreateProductVariant', 'createProductVariantAction', 'variants'],
]) {
  test(`${type}: submission queues data without creating a record, including owner submissions`, async () => {
    const env = setup(type, payload);
    const result = await load('src/lib/actions/dashboard/products/' + filename, env.mocks)[action](payload);
    assert.equal(result.ok, true);
    assert.equal(env.state.submissions.length, 1);
    assert.equal(env.state.submissions[0].type, type);
    assert.equal(env.state.products.length + env.state.variants.length, 0);
  });
  test(`${type}: approval creates once and records the reviewer`, async () => {
    const env = setup(type, payload);
    const { reviewProductApprovalAction: review } = env.actions();
    assert.equal((await review(id, 'APPROVE', 'Reviewed')).ok, true);
    assert.equal(env.state[collection].length, 1);
    assert.equal(env.state.request.reviewedById, id);
    assert.equal(env.state.request.reviewNote, 'Reviewed');
    assert.equal((await review(id, 'APPROVE')).ok, false);
    assert.equal(env.state[collection].length, 1);
  });
  test(`${type}: rejection never creates a record`, async () => {
    const env = setup(type, payload);
    assert.equal((await env.actions().reviewProductApprovalAction(id, 'REJECT')).ok, true);
    assert.equal(env.state.request.status, 'REJECTED');
    assert.equal(env.state.products.length + env.state.variants.length, 0);
  });
}

test('unknown review decisions cannot approve', async () => {
  const env = setup();
  assert.equal((await env.actions().reviewProductApprovalAction(id, 'BYPASS')).ok, false);
  assert.equal(env.state.request.status, 'PENDING');
});
test('invalid stored payload cannot approve', async () => {
  const env = setup('PRODUCT_CREATE', {});
  assert.equal((await env.actions().reviewProductApprovalAction(id, 'APPROVE')).ok, false);
  assert.equal(env.state.request.status, 'PENDING');
});
test('removed parent leaves variant pending', async () => {
  const env = setup('VARIANT_CREATE', variant);
  env.state.parent = false;
  assert.equal((await env.actions().reviewProductApprovalAction(id, 'APPROVE')).ok, false);
  assert.equal(env.state.request.status, 'PENDING');
  assert.equal(env.state.variants.length, 0);
});
test('creation failure rolls back the approval decision', async () => {
  const env = setup();
  env.prisma.product.create = async () => { throw new Error('duplicate slug'); };
  assert.equal((await env.actions().reviewProductApprovalAction(id, 'APPROVE')).ok, false);
  assert.equal(env.state.request.status, 'PENDING');
});
for (const user of [
  { email: 'someone@example.com', emailVerified: true },
  { email: 'feneelp@gmail.com', emailVerified: false },
]) {
  test(`owner restriction: ${user.email}, verified=${user.emailVerified}`, async () => {
    const env = setup();
    env.state.user = { id, ...user };
    await assert.rejects(env.actions().reviewProductApprovalAction(id, 'APPROVE'), /REDIRECT/);
    assert.equal(env.state.request.status, 'PENDING');
  });
}
