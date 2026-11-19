// Exercise the actual components with fixtures; no business records or printers are changed.
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const { chromium } = require('playwright-core');

async function main() {
  const out = path.resolve('tmp/pending-orders-verification');
  await fs.mkdir(out, { recursive: true });
  const css = await require('postcss')([require('@tailwindcss/postcss')()]).process(
    await fs.readFile('src/app/globals.css', 'utf8'), { from: path.resolve('src/app/globals.css') },
  );
  await fs.writeFile(path.join(out, 'style.css'), css.css);
  await build({
    stdin: { contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import Board from './src/components/dashboard/sales/order/PendingOrdersBoard';
      import Copy from './src/components/customerCopy/sales-order/SalesOrderCustomerCopy';
      const item = (id, label, pendingQty) => ({ id, title: label, productLabel: label, productKey: id, pendingQty, orderedQty: 10, qty: 10, unit: 'Nos', dispatchedQty: 7, invoicedQty: 7, unitPrice: '100', lineSubtotal: '1000', ComponentsOfProductInSalesOrder: [] });
      const rows = [item('lamp', 'Saved lamp', 3), item('motor', 'Unrelated motor', 7)];
      const order = { id: 'fixture-order', orderNo: 1, orderFy: '26-27', orderDate: '2026-11-19', createdAt: '2026-11-19', deliveryDate: 'As agreed', status: 'CONFIRMED', clientName: 'Fixture client', clientKey: 'client-1', totalPendingQty: 10, items: rows, clientNameSnapshot: 'Saved customer', gst: 'EXTRA', paymentTerms: 'ADVANCE', packingCharges: 'INCLUDED', transportationPayment: 'TO_PAY', subtotal: '2000', discountTotal: '0', taxableTotal: '2000', gstTotal: '360', grandTotal: '2360' };
      const many = new URLSearchParams(location.search).has('many');
      const documentOrder = many ? { ...order, items: Array.from({length: 50}, (_,i) => ({...rows[0], id: 'item-'+i, title: 'Saved item '+(i+1), description: 'Saved technical description and customer requirements. '.repeat(3)})) } : order;
      createRoot(document.getElementById('root')).render(location.pathname.includes('/view')
        ? <Copy order={documentOrder} autoPrint={new URLSearchParams(location.search).get('print') === '1'} />
        : <div data-slot="sidebar-wrapper"><aside data-slot="sidebar">Dashboard navigation</aside><main data-slot="sidebar-inset"><header>Dashboard header</header><div><Board generatedAt="2026-11-19T06:00:00Z" orders={[order]} /></div></main></div>);
    `, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, outfile: path.join(out, 'app.js'), jsx: 'automatic',
    plugins: [{ name: 'fixture-next-shims', setup(b) {
      b.onResolve({ filter: /^next\/(link|image)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'next/link'
        ? `import React from 'react'; export default function Link({children,...props}) { return <a {...props}>{children}</a> }`
        : `import React from 'react'; export default function Image({fill,priority,...props}) { return <img {...props}/> }`, loader: 'jsx', resolveDir: process.cwd() }));
    } }],
  });
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith('/asset/')) {
        const file = path.join(process.cwd(), 'public', req.url.split('?')[0]);
        res.setHeader('Content-Type', 'image/png'); res.end(await fs.readFile(file)); return;
      }
      if (req.url === '/style.css' || req.url === '/app.js') {
        res.setHeader('Content-Type', req.url.endsWith('css') ? 'text/css' : 'text/javascript');
        res.end(await fs.readFile(path.join(out, req.url.slice(1)))); return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
    } catch { res.statusCode = 404; res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => { window.printCalls = 0; window.print = () => { window.printCalls++; window.printReady = document.fonts.status === 'loaded' && [...document.images].every(img => img.complete); }; });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.getByRole('combobox', { name: 'Filter by product' }).click();
    await page.getByRole('option', { name: 'Saved lamp', exact: true }).click();
    const sheet = page.locator('[data-pending-orders-print]');
    assert.match(await sheet.textContent(), /Total Pending Qty: 3/);
    assert.ok(!(await sheet.textContent()).includes('Unrelated motor'));
    await page.getByRole('button', { name: 'Print Pending Sheet' }).click();
    assert.equal(await page.evaluate(() => window.printCalls), 1);
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('aside').isVisible(), false);
    assert.equal(await page.locator('header').isVisible(), false);
    await page.pdf({ path: path.join(out, 'pending-sheet.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    const popupPromise = context.waitForEvent('page');
    await page.getByRole('link', { name: 'Print Sales Order' }).click();
    const popup = await popupPromise;
    popup.on('pageerror', error => errors.push(error.message));
    await popup.waitForFunction(() => window.printCalls === 1);
    assert.match(popup.url(), /\/sales-orders\/fixture-order\/view\?print=1$/);
    assert.equal(await popup.evaluate(() => window.printReady), true);
    assert.match(await popup.title(), /^Sales Order-26-27-001/);
    assert.equal(await popup.locator('tbody tr').count(), 2);
    assert.equal(await popup.locator('tbody tr').first().locator('td').nth(2).innerText(), '10 Nos');
    await popup.screenshot({ path: path.join(out, 'sales-order.png'), fullPage: true });
    await popup.pdf({ path: path.join(out, 'sales-order.pdf'), preferCSSPageSize: true, printBackground: true });
    await popup.goto(`${base}/sales-orders/fixture-order/view?many=1`);
    await popup.waitForFunction(() => document.querySelectorAll('tbody tr').length === 50);
    await popup.pdf({ path: path.join(out, 'sales-order-multipage.pdf'), preferCSSPageSize: true, printBackground: true });
    const { PDFDocument } = require('pdf-lib');
    const pages = (await PDFDocument.load(await fs.readFile(path.join(out, 'sales-order-multipage.pdf')))).getPageCount();
    assert.ok(pages > 1);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ productFilter: 'passed', pendingPrintIsolation: 'passed', directPrint: 'passed', printWaitsForAssets: 'passed', orderedQuantities: 'passed', multiPageDocument: pages, consoleErrors: errors.length, artifacts: out }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
