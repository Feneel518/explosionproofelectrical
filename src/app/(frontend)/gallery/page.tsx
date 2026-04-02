import type { Metadata } from "next";
import Image from "next/image";

import { prisma } from "@/lib/prisma/db";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flameproof Product Gallery",
  description:
    "View flameproof and explosion-proof electrical product images from ExEC including well glass fittings, flameproof panels, and hazardous area equipment.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: `${SITE_NAME} Gallery`,
    description:
      "Product image gallery of flameproof and explosion-proof electrical solutions.",
    url: `${SITE_URL}/gallery`,
  },
};

export default async function GalleryPage() {
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      variants: {
        where: { status: "ACTIVE" },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          variant: true,
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            take: 4,
            select: {
              id: true,
              url: true,
              title: true,
            },
          },
        },
      },
    },
    take: 200,
  });

  const images = products.flatMap((product) =>
    product.variants.flatMap((variant) =>
      variant.images.map((media) => ({
        id: media.id,
        url: media.url,
        title:
          media.title?.trim() || `${product.name}${variant.variant ? ` - ${variant.variant}` : ""}`,
      })),
    ),
  );

  return (
    <main className="space-y-8 pb-10">
      <section className="border-y border-white py-8 md:py-12">
        <h1 className="text-3xl font-semibold tracking-wide md:text-5xl">
          Flameproof Product Gallery
        </h1>
        <p className="mt-3 max-w-4xl text-sm text-white/85 md:text-base">
          Real product visuals of our explosion-proof and flameproof electrical range
          used in hazardous industrial environments.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {images.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-white p-10 text-center text-white/80">
            No gallery images uploaded yet.
          </div>
        ) : (
          images.map((image) => (
            <article key={image.id} className="rounded-xl border border-white/80 p-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-white/20">
                <Image
                  src={image.url}
                  alt={image.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-contain p-3"
                />
              </div>
              <h2 className="mt-2 line-clamp-2 text-sm font-medium">{image.title}</h2>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
