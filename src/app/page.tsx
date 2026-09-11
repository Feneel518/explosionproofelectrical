import { IndustrialHome } from "@/components/marketing/design-preview/IndustrialHome";
import { IndustrialFonts } from "@/components/marketing/design-preview/IndustrialFonts";
import { getCatalogData } from "@/lib/marketing/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { products } = await getCatalogData();
  return <IndustrialFonts><IndustrialHome products={products} /></IndustrialFonts>;
}
