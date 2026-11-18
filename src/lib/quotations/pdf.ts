import { existsSync } from "node:fs";
import { chromium as playwright, type Browser } from "playwright-core";
import type { GetQuotationByIdData } from "@/lib/types/QuotationTypes";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

type QuotationReference = Pick<GetQuotationByIdData, "id" | "quoteFy" | "quoteNo" | "updatedAt"> & { items: { id: string }[] };
export type QuotationPdfSession = { origin: string; cookies: { name: string; value: string }[] };

export function quotationPdfFilename(quotation: Pick<GetQuotationByIdData, "quoteFy" | "quoteNo">) {
  return `Quotation-${formatFinancialDocumentNumber(quotation.quoteFy, quotation.quoteNo).replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;
}

async function launchPdfBrowser(): Promise<Browser> {
  const executablePath = process.env.PDF_CHROMIUM_EXECUTABLE_PATH;
  if (executablePath) return playwright.launch({ executablePath, headless: true });
  if (process.platform === "linux") {
    const { default: chromium } = await import("@sparticuz/chromium");
    return playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true });
  }
  const installed = process.platform === "win32" ? [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ] : ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
  const browserPath = installed.find(existsSync);
  if (!browserPath) throw new Error("Install Chrome/Edge or set PDF_CHROMIUM_EXECUTABLE_PATH for quotation PDFs.");
  return playwright.launch({ executablePath: browserPath, headless: true });
}

/** Print the existing authenticated customer-copy page; there is no second quotation template. */
export async function renderQuotationPdf(quotation: QuotationReference, session: QuotationPdfSession) {
  const origin = new URL(session.origin).origin;
  const copyPath = `/quotations/${encodeURIComponent(quotation.id)}/view`;
  const url = new URL(copyPath, origin).href;
  const browser = await launchPdfBrowser();
  const deadline = setTimeout(() => { void browser.close().catch(() => {}); }, 90_000);
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1,
      colorScheme: "light", timezoneId: "Asia/Kolkata", serviceWorkers: "block" });
    // Cookies are restricted to the app origin; never use a global Cookie request header.
    await context.addCookies(session.cookies.map((cookie) => ({ ...cookie, url: origin, httpOnly: true, secure: origin.startsWith("https:"), sameSite: "Lax" })));
    await context.route("**/*", async (route) => {
      const request = route.request();
      const target = new URL(request.url());
      // Rendering is read-only. Block analytics/actions and any external active content.
      if (request.method() !== "GET" || (target.origin !== origin && !["image", "font", "stylesheet"].includes(request.resourceType()))) return route.abort();
      if (target.origin !== origin && !(target.protocol === "https:" && (target.hostname.endsWith(".ufs.sh") || target.hostname === "utfs.io"
        || target.hostname === "fonts.googleapis.com" || target.hostname === "fonts.gstatic.com"))) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await page.emulateMedia({ media: "print" });
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!response?.ok() || new URL(page.url()).pathname !== copyPath) throw new Error("Could not open the authenticated quotation customer copy.");
    const copy = page.locator("[data-quotation-customer-copy]");
    await copy.waitFor();
    if (await copy.getAttribute("data-quotation-customer-copy") !== quotation.id
      || await copy.getAttribute("data-quotation-version") !== new Date(quotation.updatedAt).toISOString()) throw new Error("The quotation changed. Refresh and review the customer copy before sending.");
    await page.waitForFunction((itemIds) => itemIds.every((id) => Array.from(document.querySelectorAll("[data-quotation-item]")).some((row) => row.getAttribute("data-quotation-item") === id)), quotation.items.map((item) => item.id));
    await page.evaluate(() => Promise.race([
      (async () => {
        await document.fonts.ready;
        const images = Array.from(document.querySelectorAll<HTMLImageElement>("[data-quotation-customer-copy] img"));
        for (const image of images) image.loading = "eager";
        await Promise.all(images.map((image) => image.decode()));
      })(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Quotation fonts or images did not finish loading.")), 30_000)),
    ]));
    // FitContent can move rows between A4 pages after fonts/images finish loading.
    await page.evaluate(async () => {
      const copy = document.querySelector("[data-quotation-customer-copy]")!;
      let previous = "";
      let stable = 0;
      for (let frame = 0; frame < 180; frame++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const pages = Array.from(copy.querySelectorAll("[data-a4-page]"));
        const shape = pages.map((page) => `${page.clientHeight}:${page.scrollHeight}:${page.querySelectorAll("[data-quotation-item]").length}`).join("|");
        stable = shape === previous ? stable + 1 : 0;
        if (stable >= 6) return;
        previous = shape;
      }
      throw new Error("Quotation pagination did not settle.");
    });
    if (await copy.locator("[data-a4-page]").evaluateAll((pages) => pages.some((page) => page.scrollHeight > page.clientHeight + 2))) {
      throw new Error("A quotation page overflows its A4 sheet. Review the customer copy before sending.");
    }
    // The template itself owns its A4 sizes, page breaks, margins and branding.
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
  } finally { clearTimeout(deadline); await browser.close(); }
}
