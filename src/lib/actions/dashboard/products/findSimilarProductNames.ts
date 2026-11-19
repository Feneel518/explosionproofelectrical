"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { catalogProductName } from "@/lib/products/catalogNames";
import { productNameSearchTerms, rankSimilarProductNames, type ProductNameCandidate, type SimilarProductName } from "@/lib/products/similarProductNames";
import { z } from "zod";

const inputSchema = z.object({ query: z.string().trim().max(180), categoryId: z.uuid().optional() });

export async function findSimilarProductNames(input: { query: string; categoryId?: string }): Promise<{ ok: boolean; items: SimilarProductName[] }> {
  await requirePermission("master.read");
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, items: [] };
  const { query, categoryId } = parsed.data;
  const terms = productNameSearchTerms(query);
  if (!terms.length) return { ok: true, items: [] };

  // Prefixes admit small spelling mistakes; final ranking checks full words and both names.
  const fragments = [...new Set(terms.map(term => term.slice(0, 3)))];
  const contains = (value: string) => ({ contains: value, mode: "insensitive" as const });
  try {
    const [products, pending] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null, OR: fragments.flatMap(fragment => [{ name: contains(fragment) }, { displayName: contains(fragment) }]) },
        select: { id: true, name: true, displayName: true, status: true, categoryId: true, category: { select: { name: true } }, _count: { select: { variants: true } } },
        orderBy: { updatedAt: "desc" }, take: 200,
      }),
      prisma.productApprovalRequest.findMany({
        where: { type: "PRODUCT_CREATE", status: "PENDING", OR: fragments.map(fragment => ({ title: contains(fragment) })) },
        select: { id: true, title: true, payload: true }, orderBy: { createdAt: "desc" }, take: 50,
      }),
    ]);
    const candidates: ProductNameCandidate[] = products.map(product => ({
      id: product.id, kind: "product", name: catalogProductName(product), aliases: [product.name],
      categoryId: product.categoryId, categoryName: product.category.name, variantCount: product._count.variants, status: product.status,
    }));
    for (const request of pending) {
      const payload = request.payload && typeof request.payload === "object" && !Array.isArray(request.payload) ? request.payload : null;
      candidates.push({ id: request.id, kind: "pending", name: request.title, aliases: [],
        categoryId: typeof payload?.categoryId === "string" ? payload.categoryId : null, categoryName: null, variantCount: null, status: "PENDING" });
    }
    return { ok: true, items: rankSimilarProductNames(query, candidates, categoryId) };
  } catch {
    return { ok: false, items: [] };
  }
}
