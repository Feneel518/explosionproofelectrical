import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCatalogPdfProducts } from "../src/lib/marketing/catalog";
import { renderCatalogPdf } from "../src/lib/marketing/catalogPdf";
import { prisma } from "../src/lib/prisma/db";
import { readCatalogOverNeonHttp } from "../src/lib/marketing/catalogNeonHttp";

async function main() {
  const products = await (process.argv.includes("--neon-http") ? readCatalogOverNeonHttp() : getCatalogPdfProducts());
  if (!products.length) throw new Error("No published products available for export.");
  console.log(`Exporting ${products.length} products and ${products.reduce((sum, p) => sum + p.variants.length, 0)} variants...`);
  const pdf = await renderCatalogPdf(products);
  const filename = path.resolve("output/pdf/ExEC-Product-Catalog.pdf");
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, pdf);
  console.log(JSON.stringify({ filename, products: products.length, variants: products.reduce((sum, p) => sum + p.variants.length, 0), bytes: pdf.length }));
}
main().then(() => prisma.$disconnect()).then(() => process.exit(0)).catch(async (error) => { console.error(error instanceof Error ? error.message : "Export failed"); await prisma.$disconnect(); process.exit(1); });
