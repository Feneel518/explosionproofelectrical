import "dotenv/config";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UTApi } from "uploadthing/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const apply = process.argv.includes("--apply");
const sourceDir = "C:/Users/FINGERS/.codex/generated_images/01a1f278-d420-7bb3-a284-7b17f5c05003";
const covers = [
  { slug: "flameproof-junction-box-selection-guide", file: "exec-30f3962a-9081-4d2e-8f9e-d4379d4edd86.png", alt: "Illustrative cast-metal junction enclosure with brass cable glands and armoured cables in a process plant", prompt: "Premium industrial editorial photograph of a closed cast aluminium round bolted junction enclosure with brass glands and orderly black cables in a chemical process plant; natural side lighting, silver and blue, no branding or certification claims." },
  { slug: "flameproof-led-wellglass-vs-floodlight", file: "exec-7f5d48a7-3e69-4253-90b3-766c08f25012.png", alt: "Illustrative wellglass pendant and floodlight illuminating a process-plant walkway at dusk", prompt: "Premium industrial editorial photograph of a pendant wellglass luminaire and bracket-mounted rectangular floodlight illuminating a metal process-plant walkway at blue hour; realistic white light, no logos." },
  { slug: "flameproof-control-panel-specification-checklist", file: "exec-dca2fd16-2ac1-4317-9efd-96fc620188a0.png", alt: "Illustrative closed bolted control panel with indicator windows, rotary operators and cable glands", prompt: "Premium industrial editorial photograph of a closed bolted cast-metal control panel with small indicator windows, rotary operators and brass cable glands in a chemical plant; natural metal textures, no labels." },
  { slug: "flameproof-local-control-station-selection", file: "exec-e384df64-2ca2-4c60-8987-123415d56fa3.png", alt: "Illustrative local control station with green and red push buttons and a rotary selector beside an industrial pump", prompt: "Premium industrial editorial photograph of a closed compact cast-metal local station with green and red buttons and black selector beside a pump; natural daylight, no branding." },
  { slug: "flameproof-cleanroom-lighting-pharmaceutical-plants", file: "exec-5096ae2f-23a2-47d3-8891-f7f8a0c63ab3.png", alt: "Illustrative pharmaceutical cleanroom corridor with flush linear ceiling lights and stainless-steel process equipment", prompt: "Premium architectural editorial photograph of an immaculate pharmaceutical cleanroom corridor, flush sealed linear ceiling lights, stainless-steel equipment and window into process suite; neutral lighting, no people or text." },
  { slug: "flameproof-equipment-rfq-checklist-india", file: "exec-fa6057b3-cef4-4318-97f7-3f99f1a1a6e5.png", alt: "Illustrative engineering specification workspace with drawings, digital caliper, cable glands and a closed enclosure", prompt: "Premium engineering editorial still life of technical drawings, digital caliper, brass glands and a closed metal enclosure on an industrial workbench; natural side lighting, no readable text or logos." },
  { slug: "flameproof-switch-socket-selection-guide", file: "exec-d168720c-72f5-49da-8221-10967f08a760.png", alt: "Illustrative enclosed industrial switch socket with rotary operator, blue plug and black cable in a process plant", prompt: "Premium industrial editorial photograph of a heavy closed cast-metal switch socket unit with black rotary switch, blue plug and thick black cable on a steel support in a process plant; no labels or certification marks." },
  { slug: "single-double-compression-barrier-cable-glands", file: "exec-a8000208-6f06-4f02-a320-aa4d9c2151be.png", alt: "Illustrative macro view of machined cable glands, seals and threaded components on a dark engineering workbench", prompt: "Premium macro editorial photograph of polished nickel-plated brass cable glands, a short armoured cable and neatly arranged seals and threaded sleeves on a charcoal workbench; precise machining detail, no diagrams or labels." },
];

type Asset = typeof covers[number] & { localPath: string; width: number; height: number; bytes: number; url?: string; key?: string };
const manifestPath = path.join(process.cwd(), "docs/data/blog-cover-manifest-2026-11-19.json");

async function main() {
  const assetDir = path.join(process.cwd(), "public/marketing/blog");
  await mkdir(assetDir, { recursive: true });
  await mkdir(path.dirname(manifestPath), { recursive: true });
  const previous = JSON.parse(await readFile(manifestPath, "utf8").catch(() => "{\"assets\":[]}")) as { assets: Asset[] };
  const assets: Asset[] = [];
  for (const cover of covers) {
    const filename = `${cover.slug}-editorial-v2.webp`;
    const target = path.join(assetDir, filename);
    const result = await sharp(path.join(sourceDir, cover.file)).resize({ width: 1536, withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toFile(target);
    assert(result.width >= 1200 && result.height >= 800, "Cover resolution too low");
    assert(result.size < 600_000, "Cover needs further compression");
    const saved = previous.assets.find((asset) => asset.slug === cover.slug && asset.file === cover.file);
    assets.push({ ...cover, localPath: `/marketing/blog/${filename}`, width: result.width, height: result.height, bytes: result.size, ...(saved?.url ? { url: saved.url, key: saved.key } : {}) });
  }
  const saveManifest = () => writeFile(manifestPath, JSON.stringify({ generatedWith: "Built-in image_gen", usage: "AI-generated editorial illustrations, not photographs of actual ExEC products or installations", composition: "Landscape 3:2, detailed industrial photography style, central subject, no logos or certification markings", assets }, null, 2) + "\n");
  await saveManifest();

  let source = await readFile("src/lib/marketing/buyer-guide-posts.ts", "utf8");
  for (const asset of assets) {
    const marker = `slug: "${asset.slug}"`;
    const index = source.indexOf(marker);
    assert(index >= 0, `Missing source post ${asset.slug}`);
    const end = source.indexOf("    title:", index);
    const section = source.slice(index, end);
    const replacement = section.replace(/image: "[^"]*"/, `image: "${asset.localPath}"`).replace(/imageAlt: "[^"]*"/, `imageAlt: "${asset.alt}"`);
    source = source.slice(0, index) + replacement + source.slice(end);
  }
  await writeFile("src/lib/marketing/buyer-guide-posts.ts", source);
  console.table(assets.map((asset) => ({ slug: asset.slug, dimensions: `${asset.width}x${asset.height}`, KB: Math.round(asset.bytes / 1024) })));
  if (!apply) { console.log("Prepared local assets. Use --apply to upload and update the live covers."); return; }
  assert(process.env.UPLOADTHING_TOKEN, "UPLOADTHING_TOKEN is required");
  assert(process.env.DATABASE_URL, "DATABASE_URL is required");
  const schema = new URL(process.env.DATABASE_URL).searchParams.get("schema") || "public";
  assert.match(schema, /^[A-Za-z_][A-Za-z0-9_]*$/);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15_000 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  try {
    const existing = await prisma.blogPost.findMany({ where: { slug: { in: assets.map((asset) => asset.slug) } } });
    assert.equal(existing.length, assets.length, "Expected all eight articles to exist before uploading");
    const backupPath = path.join(process.cwd(), "outputs/seo-2026-11-19/covers-before-v2.json");
    await mkdir(path.dirname(backupPath), { recursive: true });
    await writeFile(backupPath, JSON.stringify(existing.map(({ slug, coverImage, coverImageAlt, updatedAt }) => ({ slug, coverImage, coverImageAlt, updatedAt })), null, 2), { flag: "wx" }).catch((error) => { if (error.code !== "EEXIST") throw error; });
    const uploader = new UTApi();
    for (const asset of assets) {
      if (asset.url) continue;
      const bytes = await readFile(path.join(process.cwd(), "public", asset.localPath));
      const result = await uploader.uploadFiles(new File([new Uint8Array(bytes)], path.basename(asset.localPath), { type: "image/webp" }));
      if (result.error || !result.data) throw new Error(`Upload failed for ${asset.slug}: ${result.error?.message}`);
      asset.url = result.data.ufsUrl;
      asset.key = result.data.key;
      assert.match(new URL(asset.url).hostname, /(?:^|\.)ufs\.sh$/);
      await saveManifest();
      console.log(`Uploaded ${asset.slug}`);
    }
    await prisma.$transaction(async (tx) => {
      for (const asset of assets) {
        const before = existing.find((post) => post.slug === asset.slug)!;
        const after = await tx.blogPost.update({ where: { slug: asset.slug }, data: { coverImage: asset.url!, coverImageAlt: asset.alt } });
        const unchanged = (record: typeof after) => {
          const { coverImage, coverImageAlt, updatedAt, ...rest } = record;
          void coverImage; void coverImageAlt; void updatedAt;
          return rest;
        };
        assert.deepEqual(unchanged(after), unchanged(before), "Only image fields should change");
      }
    });
    console.log("Updated all eight live covers and alt text. Article text and publication state preserved.");
  } finally { await prisma.$disconnect(); await pool.end(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
