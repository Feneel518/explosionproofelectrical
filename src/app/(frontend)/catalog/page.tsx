import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { prisma } from "@/lib/prisma/db";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flameproof Product Catalog",
  description:
    "Browse ExEC flameproof and explosion-proof product catalog including junction boxes, panels, well glass fittings, bulkheads, and hazardous area electrical components.",
  alternates: {
    canonical: "/catalog",
  },
  openGraph: {
    title: `${SITE_NAME} Catalog`,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/catalog`,
  },
};

function normalizeSearchQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() || "";
  return value?.trim() || "";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = normalizeSearchQuery(sp.q);

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { shortDesc: { contains: q, mode: "insensitive" } },
              {
                variants: {
                  some: {
                    OR: [
                      { variant: { contains: q, mode: "insensitive" } },
                      { sku: { contains: q, mode: "insensitive" } },
                      { typeNumber: { contains: q, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      shortDesc: true,
      category: {
        select: {
          name: true,
        },
      },
      variants: {
        where: { status: "ACTIVE" },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          variant: true,
          sku: true,
          typeNumber: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
    take: 500,
  });

  return (
    <main className="space-y-8 pb-10">
      <section className="border-y border-white py-8 md:py-12">
        <h1 className="text-3xl font-semibold tracking-wide md:text-5xl">
          Flameproof Product Catalog
        </h1>
        <p className="mt-3 max-w-4xl text-sm text-white/85 md:text-base">
          Explore our explosion-proof and flameproof electrical product range designed
          for hazardous areas, industrial plants, and safety-critical environments.
        </p>
      </section>

      <section className="rounded-xl border border-white p-4">
        <form className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by product name, variant, SKU, type number..."
            className="h-11 w-full rounded-md border border-white bg-transparent px-3 text-sm placeholder:text-white/70"
          />
          <button
            type="submit"
            className="h-11 rounded-md border border-white px-5 text-sm font-medium hover:bg-white hover:text-black"
          >
            Search
          </button>
          <Link
            href="/catalog"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white px-5 text-sm font-medium"
          >
            Reset
          </Link>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-white p-10 text-center text-white/80">
            No products found for this query.
          </div>
        ) : (
          products.flatMap((product) =>
            (product.variants.length ? product.variants : [null]).map((variant, index) => {
              const title = variant
                ? `${product.name} - ${variant.variant}`
                : product.name;
              const image = variant?.images?.[0]?.url || "/placeholder.jpg";

              return (
                <article
                  key={variant?.id || `${product.id}-${index}`}
                  className="rounded-xl border border-white/80 bg-white/5 p-4"
                >
                  <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/20">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain p-3"
                    />
                  </div>
                  <h2 className="text-lg font-semibold leading-tight">{title}</h2>
                  <p className="mt-2 text-sm text-white/80">
                    {product.shortDesc?.trim() ||
                      "Industrial-grade flameproof solution for hazardous area applications."}
                  </p>
                  <div className="mt-3 text-xs text-white/70">
                    Category: {product.category?.name || "General"}
                  </div>
                  {variant ? (
                    <div className="mt-1 text-xs text-white/70">
                      {[variant.sku, variant.typeNumber].filter(Boolean).join(" | ") || "Variant"}
                    </div>
                  ) : null}
                </article>
              );
            }),
          )
        )}
      </section>
    </main>
  );
}
