"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CatalogProductCard } from "@/lib/marketing/catalog";
import { ProductDiagram, diagramFor } from "@/components/site/ProductDiagram";
import styles from "./catalog.module.css";

export function ProductImage({ src, name, priority = false, fallbackKind }: { src: string; name: string; priority?: boolean; fallbackKind?: ReturnType<typeof diagramFor> }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) return <Image src={src} alt={name} width={600} height={500} unoptimized priority={priority} sizes="(max-width: 700px) 90vw, 40vw" onError={() => setFailed(true)} />;
  return <div className={styles.imagePlaceholder}><ProductDiagram kind={fallbackKind ?? diagramFor(name)} labels={false} title={name} /></div>;
}

export function CatalogCard({ product, index = 0 }: { product: CatalogProductCard; index?: number }) {
  const [hovered, setHovered] = useState(false);
  const kind = diagramFor(product.name, product.cat);
  const hasImage = Boolean(product.image);
  return <article className={styles.card} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
    <Link href={`/catalog/${product.slug}`} className={styles.cardImage} aria-label={`View ${product.name}`} data-has-image={hasImage}>
      <span className={styles.figure}><span>FIG. {String(index + 1).padStart(2, "0")}</span><span>{product.type}</span></span>
      {hasImage && <span className={styles.cardPhoto}><ProductImage src={product.image} name={product.name} fallbackKind={kind} /></span>}
      <span className={styles.cardDrawing} aria-hidden={hasImage}>
        <ProductDiagram kind={kind} labels={false} play={hasImage ? hovered : undefined} speed={0.55} title={product.name} />
      </span>
      {hasImage && <span className={styles.viewHint}>{hovered ? "Drawing" : "Photo"}</span>}
    </Link>
    <div className={styles.cardBody}>
      <span className={styles.eyebrow}>{product.cat}</span>
      <h3><Link href={`/catalog/${product.slug}`}>{product.name}</Link></h3>
      {product.description && <p>{product.description}</p>}
      <div className={styles.cardFoot}>
        <div className={styles.cardSpecs}>{product.ip && <span>{product.ip}</span>}{product.group && <span>{product.group}</span>}<span>{product.variantCount} {product.variantCount === 1 ? "variant" : "variants"}</span></div>
        <Link className={styles.cardLink} href={`/catalog/${product.slug}`} aria-label={`Explore ${product.name}`}><ArrowUpRight size={18} /></Link>
      </div>
    </div>
  </article>;
}
