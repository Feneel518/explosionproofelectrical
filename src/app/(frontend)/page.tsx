import Banner from "@/components/frontend/Home/Banner";
import FeaturedProducts, {
  type FeaturedProduct,
} from "@/components/frontend/Home/FeaturedProducts";
import Mission from "@/components/frontend/Home/Mission";
import NewsLetter from "@/components/frontend/Home/NewsLetter";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

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

  return (
    <main className="max-2xl:mx-4">
      <Banner />
      <FeaturedProducts products={products} />
      <NewsLetter />
      <Mission />
    </main>
  );
}
