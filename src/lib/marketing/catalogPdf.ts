import PDFKitDocument from "pdfkit";
import { PDFDocument as PDFLibDocument, PDFName } from "pdf-lib";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CatalogProductDetail, CatalogVariant } from "./catalog";
import { COMPANY_EMAIL, SITE_NAME, SITE_URL } from "@/lib/seo/site";

const NAVY = "#062637";
const PANEL = "#003d5b";
const WHITE = "#ffffff";
const MUTED = "#bed2dd";
const WIDTH = 595.28;
const HEIGHT = 841.89;
const publicRoot = path.resolve(process.cwd(), "public");
const variantsPerCard = 3;
const tocEntriesPerPage = 13;

type ProductCard = {
  product: CatalogProductDetail;
  variants: CatalogVariant[];
  chunk: number;
  chunks: number;
};

type CategorySection = {
  name: string;
  title: string;
  hero: string;
  pages: ProductCard[][];
};

async function imageBytes(source: string): Promise<Buffer | null> {
  try {
    let bytes: Buffer;
    if (source.startsWith("/") && !source.startsWith("//")) {
      const filename = path.resolve(publicRoot, `.${source}`);
      if (!filename.startsWith(publicRoot + path.sep)) return null;
      bytes = await readFile(filename);
    } else {
      const url = new URL(source);
      if (url.protocol !== "https:" || url.hostname !== "z4zi8ouylj.ufs.sh" || url.port || url.username || url.password) return null;
      const response = await fetch(url, { signal: AbortSignal.timeout(12_000), redirect: "error" });
      if (!response.ok || !response.body) return null;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 12 * 1024 * 1024) { await reader.cancel(); return null; }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      bytes = Buffer.concat(chunks);
    }
    return sharp(bytes, { limitInputPixels: 40_000_000 }).rotate()
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 }).toBuffer();
  } catch { return null; }
}

function categoryTitle(name: string) {
  return name.replace(/^Flameproof\s+/i, "").replace(/^FLameproof\s+/i, "").trim();
}

function wrapCategoryTitle(value: string) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > 17 && line) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function chunks<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
}

function buildSections(products: CatalogProductDetail[]): CategorySection[] {
  const groups = new Map<string, CatalogProductDetail[]>();
  for (const product of products) groups.set(product.cat, [...(groups.get(product.cat) || []), product]);
  return [...groups].map(([name, categoryProducts]) => {
    const cards: ProductCard[] = [];
    for (const product of categoryProducts) {
      const variantGroups = product.variants.length ? chunks(product.variants, variantsPerCard) : [[]];
      variantGroups.forEach((variants, chunk) => cards.push({ product, variants, chunk, chunks: variantGroups.length }));
    }
    return {
      name,
      title: categoryTitle(name),
      hero: categoryProducts.map((product) => product.image).find(Boolean) || "",
      pages: chunks(cards, 3),
    };
  });
}

async function renderCatalogPages(products: CatalogProductDetail[], images: Map<string, string | null>) {
  const sections = buildSections(products);
  const tocCount = Math.max(1, Math.ceil((sections.length + 3) / tocEntriesPerPage));
  const firstCategoryPage = 5 + tocCount;
  const categoryStarts = new Map<string, number>();
  let nextPage = firstCategoryPage;
  for (const section of sections) { categoryStarts.set(section.name, nextPage); nextPage += section.pages.length; }

  const doc = new PDFKitDocument({ autoFirstPage: false, bufferPages: true, margin: 0, size: "A4", compress: true });
  const output: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => output.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(output)));
    doc.on("error", reject);
  });
  doc.registerFont("Regular", path.join(publicRoot, "catalog/fonts/montserrat-regular.woff"));
  doc.registerFont("Semibold", path.join(publicRoot, "catalog/fonts/montserrat-semibold.woff"));

  const text = (value: string, x: number, y: number, size: number, width: number, bold = false, color = WHITE, options: PDFKit.Mixins.TextOptions = {}) => {
    doc.font(bold ? "Semibold" : "Regular").fontSize(size).fillColor(color).text(value, x, y, { width, lineGap: 2, ...options });
    return doc.y;
  };
  const fitText = (value: string, x: number, y: number, width: number, height: number, maxSize: number, minSize: number, bold = false, color = WHITE) => {
    doc.font(bold ? "Semibold" : "Regular");
    let size = maxSize;
    while (size > minSize) {
      doc.fontSize(size);
      if (doc.heightOfString(value, { width, lineGap: 1 }) <= height) break;
      size -= .2;
    }
    text(value, x, y, size, width, bold, color, { height, lineGap: 1 });
  };
  const rule = (y: number, x: number, end: number, width = 1) => doc.moveTo(x, y).lineTo(end, y).lineWidth(width).strokeColor(WHITE).stroke();
  const pageBase = (pageNumber: number, panelX = 48) => {
    doc.addPage();
    doc.rect(0, 0, WIDTH, HEIGHT).fill(NAVY);
    doc.rect(panelX, 60, WIDTH - panelX, 721).fill(PANEL);
    text("ExEC", 48, 26, 8, 35);
    doc.moveTo(82, 26).lineTo(82, 36).lineWidth(.5).strokeColor(MUTED).stroke();
    text("Product Catalog", 94, 26, 8, 150, false, MUTED);
    text(COMPANY_EMAIL, 48, 804, 7, 250, false, MUTED, { link: `mailto:${COMPANY_EMAIL}` });
    text(String(pageNumber).padStart(2, "0"), 515, 804, 8, 30, false, MUTED, { align: "right" });
  };
  const drawImage = (source: string, x: number, y: number, width: number, height: number) => {
    const data = images.get(source);
    if (data) doc.image(data, x, y, { fit: [width, height], align: "center", valign: "center" });
  };

  const toc = [
    { label: "Welcome", page: 2 },
    { label: "Company Overview", page: 3 + tocCount },
    { label: "Our Process", page: 4 + tocCount },
    ...sections.map((section) => ({ label: section.title, page: categoryStarts.get(section.name)! })),
  ];
  for (let pageIndex = 0; pageIndex < tocCount; pageIndex++) {
    pageBase(3 + pageIndex, 0);
    text(pageIndex ? "Table of Content / continued" : "Table of Content", 60, 100, pageIndex ? 27 : 34, 470, true);
    let y = 170;
    for (const entry of toc.slice(pageIndex * tocEntriesPerPage, (pageIndex + 1) * tocEntriesPerPage)) {
      rule(y, 60, 520, 1.3);
      text(entry.label, 84, y + 13, 11, 350);
      text(String(entry.page).padStart(2, "0"), 470, y + 13, 11, 40, false, WHITE, { align: "right" });
      y += 45;
    }
    rule(y, 60, 520, 1.3);
  }

  let pageNumber = firstCategoryPage;
  const cardX = [78, 236, 394];
  for (const section of sections) {
    for (const [sectionPage, cards] of section.pages.entries()) {
      pageBase(pageNumber);
      text("VIEW CATEGORY ONLINE", 390, 26, 7, 145, false, MUTED, { align: "right", link: `${SITE_URL}/catalog?cat=${encodeURIComponent(cards[0]?.product.categorySlug || "")}` });
      rule(90, 158, 458, 3.5);
      const pageHero = cards.map((card) => card.product.image).find((source) => images.get(source)) || section.hero;
      if (pageHero) drawImage(pageHero, 205, 98, 290, 275);
      doc.save().rotate(-90, { origin: [157, 365] });
      text(wrapCategoryTitle(section.title), 157, 365, Math.min(31, section.title.length > 28 ? 24 : 31), 245, true, WHITE, { align: "center" });
      doc.restore();
      if (sectionPage) text(`COLLECTION / ${String(sectionPage + 1).padStart(2, "0")}`, 78, 370, 7, 150, false, MUTED);

      cards.forEach((card, column) => {
        const x = cardX[column];
        const width = 142;
        const productUrl = `${SITE_URL}/catalog/${encodeURIComponent(card.product.slug)}`;
        rule(400, x, x + width, 1.2);
        const imageSource = card.variants.map((variant) => variant.images[0]?.url).find((source) => source && images.get(source)) || card.product.image;
        if (imageSource) drawImage(imageSource, x + 4, 410, width - 8, 106);
        fitText(card.product.name.toUpperCase(), x, 532, width, 39, 8.2, 5.8);
        fitText(section.title, x, 577, width, 27, 9, 6.5, true);
        if (!card.chunk) text(card.product.description, x, 607, 7.1, width, false, WHITE, { height: 29, ellipsis: true });
        const start = card.chunk * variantsPerCard + 1;
        const end = start + card.variants.length - 1;
        const variantLabel = card.product.variants.length ? `VARIANTS ${start}-${end} / ${card.product.variants.length}` : "PRODUCT OVERVIEW";
        text(variantLabel, x, 642, 6.5, width, true, MUTED);
        let variantY = 658;
        for (const variant of card.variants) {
          fitText(variant.variant, x, variantY, width, 17, 7.2, 5.2, true);
          const detail = [variant.typeNumber, variant.specs.find(([label]) => label === "Rating")?.[1]].filter(Boolean).join(" / ");
          if (detail) fitText(detail, x, variantY + 17, width, 13, 6.1, 4.5, false, MUTED);
          variantY += 31;
        }
        if (!card.product.variants.length) text("Contact ExEC for configuration options.", x, variantY, 6.5, width, false, MUTED);
        doc.link(x, 400, width, 348, productUrl);
      });
      pageNumber++;
    }
  }

  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index++) {
    doc.switchToPage(index);
    const finalPage = index < tocCount ? index + 3 : index - tocCount + firstCategoryPage;
    doc.addNamedDestination(`page-${finalPage}`, "Fit");
  }
  doc.end();
  return { bytes: await finished, tocCount, toc };
}

/** A4 catalog that preserves the supplied ExEC visual template and adds database variants. */
export async function renderCatalogPdf(products: CatalogProductDetail[]) {
  const imageSources = [...new Set(products.flatMap((product) => [
    product.image,
    ...product.variants.flatMap((variant) => variant.images.map((image) => image.url)),
  ]).filter(Boolean))];
  const images = new Map<string, string | null>();
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < imageSources.length) {
      const source = imageSources[next++];
      const bytes = await imageBytes(source);
      images.set(source, bytes ? `data:image/png;base64,${bytes.toString("base64")}` : null);
    }
  }));
  const { bytes: generated, tocCount, toc } = await renderCatalogPages(products, images);
  const reference = await readFile(path.join(publicRoot, "catalog/reference-company.pdf"));
  const [source, body] = await Promise.all([PDFLibDocument.load(reference), PDFLibDocument.load(generated)]);
  const final = await PDFLibDocument.create();
  final.setTitle("ExEC Product Catalog");
  final.setAuthor(SITE_NAME);
  final.setSubject("Company product catalog with variants");
  const [cover, welcome, overview, process] = await final.copyPages(source, [0, 1, 2, 3]);
  final.addPage(cover);
  final.addPage(welcome);
  for (const page of await final.copyPages(body, Array.from({ length: tocCount }, (_, index) => index))) final.addPage(page);
  final.addPage(overview);
  final.addPage(process);
  const categoryIndices = Array.from({ length: body.getPageCount() - tocCount }, (_, index) => index + tocCount);
  for (const page of await final.copyPages(body, categoryIndices)) final.addPage(page);
  toc.forEach((entry, index) => {
    const tocPage = final.getPage(2 + Math.floor(index / tocEntriesPerPage));
    const row = index % tocEntriesPerPage;
    const top = 170 + row * 45;
    const annotation = final.context.register(final.context.obj({
      Type: PDFName.of("Annot"),
      Subtype: PDFName.of("Link"),
      Rect: [60, HEIGHT - top - 45, 520, HEIGHT - top],
      Border: [0, 0, 0],
      Dest: [final.getPage(entry.page - 1).ref, PDFName.of("Fit")],
    }));
    tocPage.node.addAnnot(annotation);
  });
  return Buffer.from(await final.save({ useObjectStreams: true }));
}
