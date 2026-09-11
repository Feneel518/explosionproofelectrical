import { toCatalogProductDetail, type CatalogProductDetail } from "./catalog";
import { request } from "node:https";

function postJson(url: string, headers: Record<string, string>, body: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const req = request(url, { method: "POST", headers, family: 4, signal: AbortSignal.timeout(30_000) }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("error", reject);
      res.on("end", () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode })));
    });
    req.on("error", reject);
    req.setTimeout(30_000, () => req.destroy(new Error("Database HTTP export timed out.")));
    req.end(body);
  });
}

/** Optional transport for environments that cannot establish PostgreSQL TLS. */
export async function readCatalogOverNeonHttp(): Promise<CatalogProductDetail[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const database = new URL(connectionString);
  if (!database.hostname.endsWith(".neon.tech")) throw new Error("The HTTP export requires a Neon database.");
  database.hostname = database.hostname.replace(/-pooler(?=\.)/, "");
  const response = await postJson(`https://${database.hostname}/sql`,
    { "Content-Type": "application/json", "Neon-Connection-String": database.href, "Neon-Raw-Text-Output": "false", "Neon-Array-Mode": "false" },
    JSON.stringify({ query: `
      SELECT p.name, p.slug, p."flpType", p.protection, p."gasGroup", p.material,
        p.finish, p.hardware, p."hsnCode", p.zones, p."shortDesc", p."longDesc", p."categoryId",
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
        COALESCE((SELECT json_agg(vdata ORDER BY vdata."createdAt") FROM (
          SELECT v.id, v."createdAt", v.variant, v.sku, v."typeNumber", v.rating, v.terminals,
            v.gasket, v.mounting, v."cableEntry", v.earthing, v."cutoutSize", v."plateSize",
            v.size, v.glass, v."wireGuard", v.rpm, v."kW", v."horsePower",
            COALESCE((SELECT json_agg(json_build_object('url', m.url, 'title', m.title) ORDER BY m."sortOrder") FROM "ProductMedia" m WHERE m."imageVariantId" = v.id), '[]') AS images,
            COALESCE((SELECT json_agg(json_build_object('url', m.url, 'title', m.title) ORDER BY m."sortOrder") FROM "ProductMedia" m WHERE m."drawingVariantId" = v.id), '[]') AS drawings
          FROM "ProductVariant" v WHERE v."productId" = p.id AND v.status = 'ACTIVE'
        ) vdata), '[]') AS variants
      FROM "Product" p JOIN "categories" c ON c.id = p."categoryId"
      WHERE p.status = 'ACTIVE' AND p."deletedAt" IS NULL AND c.status = 'ACTIVE' AND c."deletedAt" IS NULL
      ORDER BY c.name ASC, p."createdAt" ASC`, params: [] }));
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(`Database HTTP export failed (${response.status}): ${detail?.message || "Request rejected"}`);
  }
  const result = await response.json();
  if (!Array.isArray(result.rows)) throw new Error("Unexpected database response.");
  return result.rows.map(toCatalogProductDetail);
}
