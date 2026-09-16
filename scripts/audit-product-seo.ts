import "dotenv/config";
import { prisma } from "../src/lib/prisma/db";
import { technicalDataIssues } from "../src/lib/products/technical-data";
import { categoryLandings, matchesLanding } from "../src/lib/seo/categories";
import { legacyProductAliases } from "../src/lib/seo/legacy-products";

async function main() {
  const products = process.argv.includes("--neon-http")
    ? await (await import("../src/lib/marketing/catalogNeonHttp")).readCatalogRowsOverNeonHttp()
    : await prisma.product.findMany({ where: { status: "ACTIVE", deletedAt: null, category: { status: "ACTIVE", deletedAt: null } }, select: { name: true, slug: true, flpType: true, protection: true, gasGroup: true, zones: true, category: { select: { name: true, slug: true } } } });
  if (process.argv.includes("--inventory")) {
    console.log(JSON.stringify(products.map(product => ({ name: product.name, slug: product.slug, category: product.category.slug, flpType: product.flpType, zones: product.zones })), null, 2));
    return;
  }
  const issues = products.flatMap(product => technicalDataIssues(product).map(issue => ({ slug: product.slug, name: product.name, issue })));
  const slugs = new Set(products.map(product => product.slug));
  const missingAliases = Object.entries(legacyProductAliases).filter(([, destination]) => !slugs.has(destination));
  console.log(JSON.stringify({ productsReviewed: products.length, technicalIssues: issues, unmappedLegacyTargets: missingAliases, categoryCoverage: categoryLandings.map(category => ({ slug: category.slug, products: products.filter(product => matchesLanding({ name: product.name, cat: product.category.name }, category)).length })) }, null, 2));
  if (issues.length || missingAliases.length) process.exitCode = 1;
}

main().catch(() => { console.error("Product SEO audit failed: check database connectivity and configuration."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
