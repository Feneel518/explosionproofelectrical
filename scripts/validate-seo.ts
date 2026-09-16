import "dotenv/config";
import assert from "node:assert/strict";
import { categoryLandings } from "../src/lib/seo/categories";
import { industryPages } from "../src/lib/seo/industries";
import { SITE_URL } from "../src/lib/seo/site";

const base = process.env.SEO_TEST_BASE_URL || "http://localhost:3000";
const canonicalOrigin = new URL(SITE_URL).origin;
const failures: string[] = [];
async function get(path: string) { return fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(60_000), headers: { "User-Agent": "Googlebot" } }); }
function attribute(tag: string, name: string) { return tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"))?.[1]; }
function decode(value: string) { return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"); }
async function checkPage(path: string) {
  const response = await get(path);
  assert.equal(response.status, 200, `${path}: status`);
  assert(!response.headers.get("x-robots-tag")?.includes("noindex"), `${path}: unexpected noindex`);
  const html = await response.text();
  assert(html.match(/<title>[^<]+<\/title>/i), `${path}: missing title`);
  assert((html.match(/<meta\b[^>]+>/gi) ?? []).some(tag => attribute(tag, "name") === "description" && attribute(tag, "content")), `${path}: missing description`);
  const canonicals = (html.match(/<link\b[^>]+>/gi) ?? []).filter(tag => attribute(tag, "rel") === "canonical");
  assert.equal(canonicals.length, 1, `${path}: canonical count`);
  assert.equal(new URL(decode(attribute(canonicals[0], "href") || ""), canonicalOrigin).href, new URL(path, canonicalOrigin).href, `${path}: canonical`);
  assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${path}: H1 count`);
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(match => JSON.parse(match[1]));
  assert(schemas.length, `${path}: missing JSON-LD`);
  if (/^\/catalog\/[^/]+$/.test(path)) {
    assert(!/>Zone-0</.test(html), `${path}: unsupported visible Zone 0 badge`);
    const graph = schemas.flatMap(schema => schema["@graph"] ?? [schema]);
    assert(graph.some(item => ["Product", "ProductGroup"].includes(item["@type"])), `${path}: missing product schema`);
    assert(graph.some(item => item["@type"] === "BreadcrumbList"), `${path}: missing breadcrumb schema`);
    assert(!schemas.some(schema => JSON.stringify(schema).includes("Zone-0")), `${path}: unsupported Zone 0 in schema`);
  }
  console.log(`PASS ${path}`);
}

async function main() {
  const sitemap = await get("/sitemap.xml");
  assert.equal(sitemap.status, 200, "Sitemap status");
  const xml = await sitemap.text();
  assert(xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), "Sitemap namespace");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(decode(match[1])));
  assert(urls.length, "Empty sitemap");
  assert.equal(new Set(urls.map(url => url.href)).size, urls.length, "Duplicate sitemap URLs");
  assert(urls.every(url => url.origin === canonicalOrigin && !url.search && !/^\/(product|dashboard|auth|api|about-us|contact-us|design-preview)(\/|$)/.test(url.pathname)), "Sitemap contains noncanonical URLs");
  const robots = await get("/robots.txt");
  assert.equal(robots.status, 200, "Robots status");
  assert((await robots.text()).includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`), "Robots sitemap reference");
  const products = urls.filter(url => /^\/catalog\/[^/]+$/.test(url.pathname));
  const paths = process.argv.includes("--all") ? urls.map(url => url.pathname) : [...new Set(["/", "/catalog", "/industries", "/certifications", "/story", "/engineering", "/contact", ...categoryLandings.map(item => `/catalog/category/${item.slug}`), ...industryPages.map(item => `/industries/${item.slug}`), "/knowledge-hub/equipment-protection-levels-ga-gb-gc", "/knowledge-hub/flamepaths-in-ex-d-enclosures", "/catalog/flpwp-junction-box-100-dia", ...products.slice(0, 3).map(url => url.pathname)])];
  for (let start = 0; start < paths.length; start += 3) {
    await Promise.all(paths.slice(start, start + 3).map(async path => { try { await checkPage(path); } catch (error) { failures.push(error instanceof Error ? error.message : path); } }));
  }
  for (const [source, target] of [["/about-us", "/story"], ["/contact-us", "/contact"], ["/product/flp-wp-cleanroom-switch-socket", "/catalog/flpwp-clean-room-switch-socket-fitting"], ...products.slice(0, 2).map(url => [`/product/${url.pathname.split("/").pop()}`, url.pathname])]) {
    const response = await get(source);
    assert.equal(response.status, 301, `${source}: redirect status`);
    assert.equal(new URL(response.headers.get("location")!, base).pathname, target, `${source}: destination`);
    console.log(`PASS 301 ${source}`);
  }
  assert.equal((await get("/product/nonexistent-removed-item")).status, 404, "Unknown legacy product must return 404");
  assert((await get("/catalog?q=lighting")).headers.get("x-robots-tag")?.includes("noindex"), "Catalog search must be noindex");
  console.log(`Sitemap: ${urls.length} canonical URLs. Pages checked: ${paths.length}.`);
  if (failures.length) throw new Error(failures.join("\n"));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "SEO validation failed"); process.exitCode = 1; });
