import Banner from "@/components/frontend/Home/Banner";
import FeaturedProducts, {
  type FeaturedProduct,
} from "@/components/frontend/Home/FeaturedProducts";
import Mission from "@/components/frontend/Home/Mission";
import NewsLetter from "@/components/frontend/Home/NewsLetter";
import { prisma } from "@/lib/prisma/db";
import type { Metadata } from "next";
import Script from "next/script";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flameproof & Explosion-Proof Electrical Manufacturer",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} | Flameproof Manufacturer in India`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
};

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 9,
    select: {
      id: true,
      name: true,
      shortDesc: true,
      variants: {
        where: { status: "ACTIVE" },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          variant: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });

  return rows.map((row) => {
    const primaryVariant = row.variants[0] ?? null;
    const variantLabel = primaryVariant?.variant ? ` - ${primaryVariant.variant}` : "";

    return {
      id: row.id,
      name: `${row.name}${variantLabel}`,
      description:
        row.shortDesc?.trim() ||
        "Industrial-grade flameproof solution engineered for reliability and safety.",
      imageUrl: primaryVariant?.images[0]?.url || "/placeholder.jpg",
    };
  });
}

export default async function Home() {
  const products = await getFeaturedProducts();
  const homePageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${SITE_NAME} Home`,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    about: [
      "Flameproof Junction Boxes",
      "Explosion-Proof Electrical Panels",
      "Well Glass Fittings",
      "Hazardous Area Electrical Equipment",
    ],
  };

  const featuredItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured Flameproof Products",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.imageUrl.startsWith("http")
          ? product.imageUrl
          : `${SITE_URL}${product.imageUrl}`,
      },
    })),
  };

  return (
    <main className="max-2xl:mx-4">
      <Script
        id="homepage-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageJsonLd) }}
      />
      <Script
        id="featured-products-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featuredItemListJsonLd) }}
      />
      <Banner />
      <FeaturedProducts products={products} />
      <NewsLetter />
      <Mission />
    </main>
  );
}
