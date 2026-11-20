"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, FileDown } from "lucide-react";
import type { CatalogProductCard, CatalogProductDetail } from "@/lib/marketing/catalog";
import { RequestQuoteModal } from "@/components/marketing/RequestQuoteModal";
import { cadDrawings, type CadKind } from "@/components/site/cad-drawings";
import { ProductDiagram, diagramFor } from "@/components/site/ProductDiagram";
import { Reveal } from "@/components/site/motion";
import { CatalogCard, ProductImage } from "./CatalogCard";
import { ShareActions } from "./ShareActions";
import styles from "./catalog.module.css";
import { ProductLinks } from "@/components/seo/ProductLinks";

export function IndustrialProduct({ product, related }: { product: CatalogProductDetail; related: CatalogProductCard[] }) {
  const [variantId, setVariantId] = useQueryState("variant", { history: "push" });
  const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
  const [imageIndex, setImageIndex] = useState(0);
  const images = variant?.images.length ? variant.images : product.image ? [{ url: product.image, title: product.name }] : [];
  const [view, setView] = useState<"photo" | "drawing">(images.length ? "photo" : "drawing");
  const selectedImage = images[imageIndex] || images[0];
  const kind = diagramFor(product.name, product.cat);
  const path = `/catalog/${product.slug}${variant ? `?variant=${encodeURIComponent(variant.id)}` : ""}`;
  const title = `${product.name}${variant ? ` — ${variant.variant}` : ""} | ExEC`;
  const specs = [
    ["Type number", variant?.typeNumber || product.flpType], ["SKU", variant?.sku],
    ["Certification marking", product.certificationMarking], ["Protection", product.protection], ["Gas group", product.gasGroup],
    ["Material", product.material], ["Finish", product.finish], ["Hardware", product.hardware],
    ["Zones", product.zones.join(" / ")], ["HSN code", product.hsnCode],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const showingDrawing = view === "drawing" || !images.length;

  return <div data-no-reveal>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/catalog"><ArrowLeft size={15} /> Catalog</Link><span>/</span><Link href={`/catalog/category/${product.categorySlug}`}>{product.cat}</Link><span>/</span><span aria-current="page">{product.name}</span></nav>
    <section className={styles.productHero}>
      <div className={styles.gallery}>
        <div className={styles.galleryStage} data-view={showingDrawing ? "drawing" : "photo"}>
          <div className={styles.galleryLabel}>
            <span>{variant?.typeNumber || product.type}</span>
            {images.length > 0 && <div className={styles.viewToggle} role="group" aria-label="Product view">
              {(["photo", "drawing"] as const).map((item) => <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)}>{view === item && <motion.span layoutId="product-view" className={styles.viewPill} transition={{ type: "spring", stiffness: 420, damping: 36 }} />}<span>{item === "photo" ? "Photo" : "Line drawing"}</span></button>)}
            </div>}
          </div>
          <AnimatePresence mode="wait">
            {showingDrawing
              ? <motion.div key="drawing" className={styles.galleryDrawing} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><ProductDiagram kind={kind} play speed={0.75} title={product.name} /></motion.div>
              : <motion.div key={selectedImage?.url || "empty"} className={styles.galleryPhoto} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}><ProductImage src={selectedImage?.url || ""} name={selectedImage?.title || product.name} fallbackKind={kind} priority sizes="(max-width: 900px) 92vw, 50vw" /></motion.div>}
          </AnimatePresence>
          <div className={styles.galleryCaption}><span>{showingDrawing ? (kind in cadDrawings ? `From GA drawing ${cadDrawings[kind as CadKind].type} · sizes in mm` : "Illustrative line drawing · see datasheet for dimensions") : selectedImage?.title || product.name}</span><span>{!showingDrawing && images.length ? `${String(Math.min(imageIndex + 1, images.length)).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}` : ""}</span></div>
        </div>
        {images.length > 1 && !showingDrawing && <div className={styles.thumbnails} role="group" aria-label="Product images">{images.map((item, index) => <button key={`${item.url}-${index}`} type="button" aria-label={`View image ${index + 1}`} aria-pressed={index === imageIndex} onClick={() => setImageIndex(index)}><ProductImage src={item.url} name={item.title || `${product.name} view ${index + 1}`} fallbackKind={kind} sizes="96px" /></button>)}</div>}
      </div>

      <div className={styles.productInfo}>
        <Reveal><span className={styles.eyebrow}>{product.cat}</span></Reveal>
        <Reveal delay={0.05}><h1>{product.name}</h1></Reveal>
        <Reveal delay={0.1}><p className={styles.description}>{product.description}</p></Reveal>
        <Reveal delay={0.15}><div className={styles.productBadges}>{product.ip && <span>{product.ip}</span>}{product.group && <span>{product.group}</span>}{product.zones.map((zone) => <span key={zone}>{zone}</span>)}</div></Reveal>
        {product.variants.length > 0 && <Reveal delay={0.2} className={styles.variantPicker}><label htmlFor="product-variant">Configuration <span>{product.variants.length} available</span></label><select id="product-variant" value={variant?.id || ""} onChange={(event) => { setImageIndex(0); void setVariantId(event.target.value); }}>{product.variants.map((item) => <option key={item.id} value={item.id}>{item.variant}{item.typeNumber ? ` / ${item.typeNumber}` : ""}</option>)}</select></Reveal>}
        <Reveal delay={0.25} className={styles.enquiryPanel}>
          <span>Let’s get the specification right.</span>
          <p>Ask our team for pricing, lead time and application support.</p>
          <RequestQuoteModal key={variant?.id || product.slug} productOptions={[`${product.name}${variant ? ` — ${variant.variant}` : ""}`]} />
        </Reveal>
        <ShareActions title={title} path={path} label="Share product" printable />
      </div>
    </section>

    <section className={styles.specSection}>
      <div className={styles.specIntro}>
        <span className={styles.eyebrow}>Technical details</span>
        <h2>Every detail. <span>In one place.</span></h2>
        <p>Product specifications and configuration details for your project conversations.</p>
      </div>
      <div className={styles.specTables}>
        <h3>Product specification</h3>
        {specs.length ? <Reveal><dl className={styles.specList}>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></Reveal> : <p>Contact our team for the product specification.</p>}
        {variant && <><h3>{variant.variant} · configuration</h3>{variant.specs.length ? <Reveal><dl className={styles.specList}>{variant.specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></Reveal> : <p>Detailed configuration specifications are available on enquiry.</p>}</>}
        {Boolean(variant?.drawings.length) && <div className={styles.drawings}><h3>Drawings & documents</h3>{variant?.drawings.map((drawing, index) => <a key={`${drawing.url}-${index}`} href={drawing.url} target="_blank" rel="noopener noreferrer"><FileDown size={18} />{drawing.title || `Technical drawing ${index + 1}`}<ArrowUpRight size={16} /></a>)}</div>}
        {product.longDescription && <div className={styles.longDescription}><h3>About this product</h3><p>{product.longDescription}</p></div>}
      </div>
    </section>
    {product.technicalNotes.map(note => <p className={styles.selectionNote} key={note}>{note}</p>)}
    <ProductLinks product={product} />
    {related.length > 0 && <section className={styles.relatedSection}>
      <div className={styles.relatedHeading}><div><span className={styles.eyebrow}>Explore the range</span><h2>In good <span>company.</span></h2></div><Link href={`/catalog/category/${product.categorySlug}`}>View category <ArrowUpRight size={17} /></Link></div>
      <div className={styles.relatedGrid}>{related.map((item, index) => <CatalogCard key={item.slug} product={item} index={index} />)}</div>
    </section>}
    <div className={styles.mobileProductActions}><Link href="/catalog"><ArrowLeft size={16} />Catalog</Link><Link href="/contact" className={styles.mobileEnquire}>Enquire <ArrowUpRight size={16} /></Link></div>
  </div>;
}
