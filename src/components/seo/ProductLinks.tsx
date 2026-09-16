import Link from "next/link";
import { productLandings } from "@/lib/seo/categories";
import { getKnowledgeArticle } from "@/lib/marketing/knowledge";
import styles from "@/components/marketing/design-preview/catalog.module.css";
import { isNonHazardousProduct } from "@/lib/products/technical-data";

export function ProductLinks({ product }: { product: { name: string; cat: string } }) {
  const families = productLandings(product);
  const guides = [...new Set(families.flatMap(family => family.guides))].slice(0, 3);
  const nonHazardous = isNonHazardousProduct({ name: product.name, category: { name: product.cat } });
  return <section className={styles.selectionContent} aria-label="Product selection resources">
    <h2>Specify this product</h2><p>{nonHazardous ? "Review available configurations and operating requirements with our engineering team. This product must not be selected as hazardous-area equipment from inherited catalog labels." : "Review the product family and technical guides alongside your area classification and the complete equipment certificate."}</p>
    <nav className={styles.resourceLinks} aria-label="Related product families and engineering guides">
      {families.map(family => <Link key={family.slug} href={`/catalog/category/${family.slug}`}>{family.name}</Link>)}
      {guides.map(slug => <Link key={slug} href={`/knowledge-hub/${slug}`}>{getKnowledgeArticle(slug)?.title}</Link>)}
      {!nonHazardous && <Link href="/certifications">Certification documents</Link>}<Link href="/contact">Request technical specifications</Link>
    </nav>
  </section>;
}
