const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { load } = require('./test-loader.cjs');

const item = (id, key, qty) => ({ id, title: key, productLabel: key, productKey: key, pendingQty: qty, orderedQty: 10, dispatchedQty: 0, invoicedQty: 10 - qty });
const order = (id, clientKey, items) => ({ id, orderNo: 1, orderFy: '26-27', orderDate: null, deliveryDate: 'As agreed', status: 'CONFIRMED', clientName: 'Same company', clientKey, totalPendingQty: 999, items });

function renderBoard(orders, filters = ['ALL', 'ALL', '']) {
  let hookIndex = 0;
  const { default: Board } = load('src/components/dashboard/sales/order/PendingOrdersBoard', {
    react: { ...React, useState: () => [filters[hookIndex++], () => {}] },
    'next/link': ({ children, ...props }) => React.createElement('a', props, children),
    '@/components/customerCopy/sales-order/PrintSalesOrderButton': () => null,
  });
  return renderToStaticMarkup(React.createElement(Board, { generatedAt: '2026-11-19T06:00:00Z', orders }));
}

test('product filter removes unrelated lines from the board and printed worksheet', () => {
  const html = renderBoard([order('order-1', 'client-1', [item('a', 'Selected lamp', 3), item('b', 'Unrelated motor', 7)])], ['ALL', 'Selected lamp', '']);
  assert.ok(!html.includes('Unrelated motor'), 'unrelated product must not appear in filtered rows or print output');
  assert.match(html, /Total Pending Qty: 3/);
});

test('client summaries count customer identities even when names match', () => {
  const html = renderBoard([order('order-1', 'client-1', [item('a', 'Lamp', 3)]), order('order-2', 'client-2', [item('b', 'Lamp', 7)])]);
  assert.match(html, /Clients: <span[^>]*>2<\/span>/);
  assert.match(html, /Total Pending Qty: 10/);
});

test('pending query excludes drafts and derives totals from actual outstanding items without truncating orders', async () => {
  let query;
  const { default: Page } = load('src/app/dashboard/sales/pending/page', {
    '@/lib/check/permissions': { requirePagePermission: async () => ({}) },
    '@/lib/prisma/db': { prisma: { salesOrder: { findMany: async args => {
      query = args;
      return [{ ...order('order-1', 'client-1', []), customerId: 'client-1', customer: null, clientNameSnapshot: 'Historic client', items: [{ id: 'a', title: 'Historic lamp', qty: 10, pendingQty: 3, invoicedQty: 7, dispatchedQty: 7, product: null, variant: null }] }];
    } } } },
    '@/components/dashboard/sales/order/PendingOrdersBoard': () => null,
  });
  const result = await Page();
  assert.ok(query.where.status.notIn.includes('DRAFT'));
  assert.equal(query.take, undefined, 'all pending orders must contribute to summaries');
  assert.equal(query.where.items.some.pendingQty.gt, 0);
  assert.equal(result.props.orders[0].totalPendingQty, 3);
});

test('product search narrows item quantities while client search retains matching order lines', () => {
  const rows = [order('order-1', 'client-1', [item('a', 'Lamp', 3), item('b', 'Motor', 7)])];
  const byProduct = renderBoard(rows, ['ALL', 'ALL', 'Lamp']);
  assert.ok(!byProduct.includes('Motor'));
  assert.match(byProduct, /Total Pending Qty: 3/);
  const byClient = renderBoard(rows, ['ALL', 'ALL', 'Same company']);
  assert.match(byClient, /Total Pending Qty: 10/);
  assert.ok(byClient.includes('Motor'));
});

test('print action opens the actual sales order document with automatic printing enabled', () => {
  const { default: Print } = load('src/components/customerCopy/sales-order/PrintSalesOrderButton');
  const html = renderToStaticMarkup(React.createElement(Print, { orderId: 'order-1' }));
  assert.match(html, /href="\/sales-orders\/order-1\/view\?print=1"/);
  assert.match(html, /target="_blank"/);
});

test('sales order document prints original ordered quantities, saved descriptions and commercial totals', () => {
  const { default: Copy } = load('src/components/customerCopy/sales-order/SalesOrderCustomerCopy', {
    'next/image': () => null,
    './SalesOrderPrintControls': () => null,
  });
  const html = renderToStaticMarkup(React.createElement(Copy, { order: {
    ...order('order-1', 'client-1', []), clientNameSnapshot: 'Saved customer',
    customer: { companyName: 'Renamed customer' }, createdAt: '2026-11-19',
    gst: 'EXTRA', paymentTerms: 'ADVANCE', packingCharges: 'INCLUDED', transportationPayment: 'TO_PAY',
    subtotal: '1000', discountTotal: '0', taxableTotal: '1000', gstTotal: '180', grandTotal: '1180',
    items: [{ ...item('a', 'Historical lamp title', 3), qty: 10, unit: 'Nos', unitPrice: '100', lineSubtotal: '1000', ComponentsOfProductInSalesOrder: [] }],
  } }));
  assert.match(html, /Sales Order/);
  assert.match(html, /Saved customer/);
  assert.ok(!html.includes('Renamed customer'));
  assert.match(html, /Historical lamp title/);
  assert.match(html, />10 Nos<\/td>/);
  assert.match(html, /1,180/);
  assert.match(html, /As agreed/);
});

test('sales order print route rejects deleted orders and enables automatic printing only on request', async () => {
  let savedOrder = { id: 'order-1', deletedAt: null };
  const { default: Page } = load('src/app/(customerCopy)/sales-orders/[id]/view/page', {
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND'); } },
    '@/lib/actions/dashboard/sales/order/getSalesOrderByIdAction': { getSalesOrderByIdAction: async () => ({ ok: true, order: savedOrder }) },
    '@/components/customerCopy/sales-order/SalesOrderCustomerCopy': () => null,
  });
  const request = print => ({ params: Promise.resolve({ id: 'order-1' }), searchParams: Promise.resolve({ print }) });
  assert.equal((await Page(request('1'))).props.autoPrint, true);
  assert.equal((await Page(request(undefined))).props.autoPrint, false);
  savedOrder = { ...savedOrder, deletedAt: '2026-11-19' };
  await assert.rejects(Page(request('1')), /NOT_FOUND/);
});
