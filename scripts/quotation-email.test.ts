import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { buildQuotationMime, quotationEmailSchema, GmailSendUncertainError, sendQuotationWithGmail } from "../src/lib/gmail/send";
import { GmailApiError, GMAIL_READ_SCOPE, GMAIL_SCOPE, GMAIL_SEND_SCOPE, gmailCanSend } from "../src/lib/gmail/google";
import { deliverQuotation } from "../src/lib/quotations/delivery";
import { quotationPdfFilename, renderQuotationPdf } from "../src/lib/quotations/pdf";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

test("PDF generation authenticates to the customer-copy route, waits for content and rejects stale copies", { timeout: 180_000 }, async () => {
  const quotation = { id: "f43cba40-b5de-4fd1-a3c5-6c3b576a633c", quoteNo: 7, quoteFy: "FY2026-27",
    updatedAt: new Date("2026-11-17T10:00:00.000Z"), items: [{ id: "saved-item" }] };
  const requests: string[] = [];
  const server = createServer((request, response) => {
    requests.push(`${request.method} ${request.url}`);
    if (request.url === "/auth/login") { response.setHeader("Content-Type", "text/html"); response.end("Please sign in."); return; }
    if (request.headers.cookie !== "viewer=test-session") { response.writeHead(302, { Location: "/auth/login" }).end(); return; }
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><style>@page{size:A4;margin:0}body,h1{margin:0}[data-a4-page]{width:210mm;height:297mm}</style>
      <main data-quotation-customer-copy="${quotation.id}" data-quotation-version="${quotation.updatedAt.toISOString()}">
      <div data-a4-page><h1>Existing customer copy</h1><div id="item"></div></div></main>
      <script>setTimeout(()=>document.getElementById('item').setAttribute('data-quotation-item','saved-item'),50);fetch('/blocked-action',{method:'POST'}).catch(()=>{});</script>`);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address() as AddressInfo;
    const session = { origin: `http://127.0.0.1:${address.port}`, cookies: [{ name: "viewer", value: "test-session" }] };
    const pdf = await renderQuotationPdf(quotation, session);
    assert.equal((await PDFDocument.load(pdf)).getPageCount(), 1);
    assert.equal(quotationPdfFilename(quotation), "Quotation-FY2026-27-007.pdf");
    assert.ok(requests.includes(`GET /quotations/${quotation.id}/view`));
    assert.equal(requests.some((request) => request.startsWith("POST")), false);
    await mkdir("tmp/pdfs", { recursive: true });
    await writeFile("tmp/pdfs/quotation-renderer-test.pdf", pdf);
    await assert.rejects(renderQuotationPdf({ ...quotation, updatedAt: new Date("2026-11-18T10:00:00.000Z") }, session), /changed/);
    await assert.rejects(renderQuotationPdf(quotation, { ...session, cookies: [] }), /authenticated/);
  } finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});


test("old read-only grants cannot send; authorization requests include both required scopes", () => {
  assert.equal(gmailCanSend(GMAIL_READ_SCOPE), false);
  assert.equal(gmailCanSend(GMAIL_SCOPE), true);
  assert.ok(GMAIL_SCOPE.split(" ").includes(GMAIL_SEND_SCOPE));
});

test("email input rejects header injection and multiple recipients", () => {
  const valid = { quotationId: "f43cba40-b5de-4fd1-a3c5-6c3b576a633c", requestId: "af84c454-6a31-4ccd-a190-e02193f78433",
    expectedUpdatedAt: "2026-11-17T10:00:00.000Z", recipient: "buyer@example.com", subject: "Quotation 001", message: "Please find attached." };
  assert.ok(quotationEmailSchema.safeParse(valid).success);
  assert.equal(quotationEmailSchema.safeParse({ ...valid, recipient: "buyer@example.com, hidden@example.com" }).success, false);
  assert.equal(quotationEmailSchema.safeParse({ ...valid, subject: "Quote\r\nBcc: hidden@example.com" }).success, false);
  assert.equal(quotationEmailSchema.safeParse({ ...valid, message: " " }).success, false);
});

test("MIME preserves the PDF bytes, UTF-8 subject, recipient and message", async () => {
  const document = await PDFDocument.create(); document.addPage();
  const pdf = Buffer.from(await document.save());
  const raw = await buildQuotationMime({ sender: "sales@example.com", recipient: "buyer@example.com", subject: "Quotation – ₹100",
    message: "Dear buyer,\nPlease find attached our quotation.", filename: "Quotation-001.pdf", pdf });
  const mime = Buffer.from(raw, "base64url").toString("utf8");
  assert.match(mime, /From: sales@example.com/);
  assert.match(mime, /To: buyer@example.com/);
  assert.match(mime, /Dear buyer,/);
  assert.match(mime, /Content-Type: application\/pdf; name=Quotation-001.pdf/);
  assert.match(mime, /Content-Disposition: attachment; filename=Quotation-001.pdf/);
  const part = mime.split(/Content-Transfer-Encoding: base64\r\n/)[1];
  assert.ok(part);
  const encoded = part.slice(part.indexOf("\r\n\r\n") + 4).split("\r\n--")[0];
  assert.deepEqual(Buffer.from(encoded, "base64"), pdf);
  await assert.rejects(buildQuotationMime({ sender: "sales@example.com", recipient: "buyer@example.com", subject: "Quote", message: "Hello", filename: "x.pdf", pdf: Buffer.from("not a PDF") }));
});

test("Gmail send posts base64url MIME once and returns its receipt", async () => {
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    calls++;
    assert.equal(String(input), "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    assert.equal(init?.method, "POST");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-token");
    assert.deepEqual(JSON.parse(String(init?.body)), { raw: "test-mime" });
    return Response.json({ id: "sent-message" });
  };
  assert.equal(await sendQuotationWithGmail("test-token", "test-mime"), "sent-message");
  assert.equal(calls, 1);
});

test("rejected permission and rate limits are safe errors; lost responses never retry", async () => {
  for (const status of [401, 403, 429]) {
    globalThis.fetch = async () => Response.json({ error: "private Google details" }, { status });
    await assert.rejects(sendQuotationWithGmail("test", "raw"), (error: unknown) => error instanceof GmailApiError && error.status === status && !error.message.includes("private"));
  }
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("timeout"); };
  await assert.rejects(sendQuotationWithGmail("test", "raw"), GmailSendUncertainError);
  assert.equal(calls, 1);
  for (const response of [Response.json({}, { status: 503 }), Response.json({})]) {
    globalThis.fetch = async () => response;
    await assert.rejects(sendQuotationWithGmail("test", "raw"), GmailSendUncertainError);
  }
});

test("a concurrent replay never sends a quotation twice", async () => {
  let state: "NEW" | "PENDING" | "SENT" = "NEW";
  let sends = 0;
  const steps = {
    claim: async () => { const previous = state; if (state === "NEW") state = "PENDING"; return previous; },
    prepare: async () => "prepared",
    send: async () => { sends++; return "message-id"; },
    record: async (status: string) => { if (status === "SENT") state = "SENT"; },
  };
  const results = await Promise.all([deliverQuotation(steps), deliverQuotation(steps)]);
  assert.equal(sends, 1);
  assert.ok(results.some((result) => result.ok));
  assert.equal((await deliverQuotation(steps)).ok, true);
  assert.equal(sends, 1);
});

test("PDF/token failures cannot send; ambiguous sends block replay; receipt failure preserves success", async () => {
  const recorded: string[] = [];
  let sends = 0;
  const steps = { claim: async () => "NEW" as const, prepare: async () => "prepared",
    send: async () => { sends++; return "message-id"; }, record: async (status: string) => { recorded.push(status); } };
  assert.equal((await deliverQuotation({ ...steps, prepare: async () => { throw new Error("bad PDF"); } })).ok, false);
  assert.equal(sends, 0);
  assert.deepEqual(recorded, ["FAILED"]);
  recorded.length = 0;
  assert.equal((await deliverQuotation({ ...steps, send: async () => { throw new GmailSendUncertainError(); } })).uncertain, true);
  assert.deepEqual(recorded, ["UNKNOWN"]);
  await deliverQuotation({ ...steps, claim: async () => "UNKNOWN" });
  assert.equal(sends, 0);
  assert.equal((await deliverQuotation({ ...steps, record: async () => { throw new Error("database offline"); } })).ok, true);
  assert.equal(sends, 1);
});

