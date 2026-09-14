"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { ArrowLeft, ArrowUpRight, FileDown } from "lucide-react";
import type { CatalogProductCard, CatalogProductDetail } from "@/lib/marketing/catalog";
import { RequestQuoteModal } from "@/components/marketing/RequestQuoteModal";
import { CatalogCard, ProductImage } from "./CatalogCard";
import { ShareActions } from "./ShareActions";
import home from "./industrial-home.module.css";
import styles from "./catalog.module.css";

export function IndustrialProduct({ product, related }: { product: CatalogProductDetail; related: CatalogProductCard[] }) {
  const [variantId, setVariantId] = useQueryState("variant", { history: "push" });
  const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
  const [imageIndex, setImageIndex] = useState(0);
  const images = variant?.images.length ? variant.images : product.image ? [{ url: product.image, title: product.name }] : [];
  const selectedImage = images[imageIndex] || images[0];
  const path = `/catalog/${product.slug}${variant ? `?variant=${encodeURIComponent(variant.id)}` : ""}`;
  const title = `${product.name}${variant ? ` — ${variant.variant}` : ""} | ExEC`;
  const specs = [
    ["Type number", variant?.typeNumber || product.flpType], ["SKU", variant?.sku],
    ["Protection", product.protection], ["Gas group", product.gasGroup],
    ["Material", product.material], ["Finish", product.finish], ["Hardware", product.hardware],
    ["Zones", product.zones.join(" / ")], ["HSN code", product.hsnCode],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  return <>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/catalog"><ArrowLeft size={15} /> Catalog</Link><span>/</span><Link href={`/catalog/category/${product.categorySlug}`}>{product.cat}</Link><span>/</span><span aria-current="page">{product.name}</span></nav>
    <section className={styles.productHero}>
      <div className={styles.gallery}><div className={styles.galleryStage}><div className={styles.galleryLabel}><span>ExEC / PRODUCT DETAIL</span><span>+</span></div><ProductImage key={selectedImage?.url || "empty"} src={selectedImage?.url || ""} name={selectedImage?.title || product.name} priority /><div className={styles.galleryCaption}><span>{variant?.typeNumber || product.type}</span><span>{images.length ? `${String(Math.min(imageIndex + 1, images.length)).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}` : "IMAGE COMING SOON"}</span></div></div>{images.length > 1 && <div className={styles.thumbnails} role="group" aria-label="Product images">{images.map((item, index) => <button key={`${item.url}-${index}`} aria-label={`View image ${index + 1}`} aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}><ProductImage src={item.url} name={item.title || `${product.name} view ${index + 1}`} /></button>)}</div>}</div>
      <div className={styles.productInfo}><span className={styles.eyebrow}>{product.cat} / {product.type}</span><h1>{product.name}</h1><p className={styles.description}>{product.description}</p><div className={styles.productBadges}>{product.ip && <span>{product.ip}</span>}{product.group && <span>{product.group}</span>}{product.zones.map((zone) => <span key={zone}>{zone}</span>)}</div>
        {product.variants.length > 0 && <div className={styles.variantPicker}><label htmlFor="product-variant">SELECT CONFIGURATION <span>{product.variants.length} AVAILABLE</span></label><select id="product-variant" value={variant?.id || ""} onChange={(event) => { setImageIndex(0); void setVariantId(event.target.value); }}>{product.variants.map((item) => <option key={item.id} value={item.id}>{item.variant}{item.typeNumber ? ` / ${item.typeNumber}` : ""}</option>)}</select></div>}
        <div className={styles.enquiryPanel}><span>LET’S GET THE SPECIFICATION RIGHT.</span><p>Ask our team for pricing, lead time and application support.</p><div className={home.quoteButton}><RequestQuoteModal key={variant?.id || product.slug} contentClassName={home.quoteDialog} productOptions={[`${product.name}${variant ? ` — ${variant.variant}` : ""}`]} /></div></div>
        <ShareActions title={title} path={path} label="Share product" printable />
      </div>
    </section>
    <section className={styles.specSection}><div className={styles.specIntro}><span className={styles.eyebrow}>01 / THE TECHNICAL DETAILS</span><h2>EVERY DETAIL.<br /><span>IN ONE PLACE.</span></h2><p>Product specifications and configuration details for your project conversations.</p></div><div className={styles.specTables}><h3>Product specification</h3>{specs.length ? <dl className={styles.specList}>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p>Contact our team for the product specification.</p>}{variant && <><h3>{variant.variant} / configuration</h3>{variant.specs.length ? <dl className={styles.specList}>{variant.specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p>Detailed configuration specifications are available on enquiry.</p>}</>}{Boolean(variant?.drawings.length) && <div className={styles.drawings}><h3>Drawings & documents</h3>{variant?.drawings.map((drawing, index) => <a key={`${drawing.url}-${index}`} href={drawing.url} target="_blank" rel="noopener noreferrer"><FileDown size={18} />{drawing.title || `Technical drawing ${index + 1}`}<ArrowUpRight size={16} /></a>)}</div>}{product.longDescription && <div className={styles.longDescription}><h3>About this product</h3><p>{product.longDescription}</p></div>}</div></section>
    {related.length > 0 && <section className={styles.relatedSection}><div className={styles.relatedHeading}><div><span className={styles.eyebrow}>02 / EXPLORE THE RANGE</span><h2>IN GOOD COMPANY.</h2></div><Link href={`/catalog?cat=${product.categorySlug}`}>VIEW CATEGORY <ArrowUpRight size={17} /></Link></div><div className={styles.relatedGrid}>{related.map((item, index) => <CatalogCard key={item.slug} product={item} index={index} />)}</div></section>}
    <div className={styles.mobileProductActions}><Link href="/catalog"><ArrowLeft size={16} />Catalog</Link><a href="#main-content">Product details ↑</a><Link href="/#contact">Enquire <ArrowUpRight size={16} /></Link></div>
  </>;
}
