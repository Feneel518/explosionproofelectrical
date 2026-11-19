import type { CatalogProductDetail } from "@/lib/marketing/catalog";
import { absoluteUrl } from "./site";

export function productMetadata(product: CatalogProductDetail) {
  const name = product.name.replace(/^FLP\s*\/\s*WP\s*/i, "Flameproof ");
  const title = name.length < 52 ? `${name} Manufacturer in India` : name;
  const description = `${name} by ExEC, Vapi, India. ${product.variantCount ? `Compare ${product.variantCount} configuration${product.variantCount === 1 ? "" : "s"} and ` : "Review specifications and "}request a project quotation.`;
  return { title, description };
}

export function productSchema(product: CatalogProductDetail) {
  const url = absoluteUrl(`/catalog/${product.slug}`);
  const properties = [
    ["Ingress protection", product.protection], ["Gas group", product.gasGroup],
    ["Material", product.material], ["Finish", product.finish],
    ["Declared zones", product.zones.join(", ")],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  const common = {
    description: product.description, category: product.cat,
    brand: { "@type": "Brand", name: "ExEC" },
    manufacturer: { "@id": absoluteUrl("/#organization") },
    image: product.image ? [product.image.startsWith("/") ? absoluteUrl(product.image) : product.image] : undefined,
    additionalProperty: properties.map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
  };
  const entity = product.variants.length > 1 ? {
    "@type": "ProductGroup", "@id": `${url}#product`, name: product.name, url, ...common,
    productGroupID: product.slug, variesBy: "Configuration",
    hasVariant: product.variants.map(variant => ({
      "@type": "Product", "@id": `${url}#variant-${variant.id}`, ...common,
      name: `${product.name} - ${variant.variant}`, sku: variant.sku || undefined,
      model: variant.typeNumber || undefined, url: `${url}?variant=${encodeURIComponent(variant.id)}`,
      image: variant.images.length ? variant.images.map(image => image.url.startsWith("/") ? absoluteUrl(image.url) : image.url) : common.image,
      isVariantOf: { "@id": `${url}#product` },
      additionalProperty: [...common.additionalProperty, ...variant.specs.map(([name, value]) => ({ "@type": "PropertyValue", name, value }))],
    })),
  } : {
    "@type": "Product", "@id": `${url}#product`, name: product.name, url, ...common,
    sku: product.variants[0]?.sku || undefined, model: product.variants[0]?.typeNumber || undefined,
  };
  return { "@context": "https://schema.org", "@graph": [entity,
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Catalog", item: absoluteUrl("/catalog") },
      { "@type": "ListItem", position: 3, name: product.cat, item: absoluteUrl(`/catalog/category/${product.categorySlug}`) },
      { "@type": "ListItem", position: 4, name: product.name, item: url },
    ] },
  ] };
}
