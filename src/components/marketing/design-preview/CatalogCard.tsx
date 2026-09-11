"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Box } from "lucide-react";
import type { CatalogProductCard } from "@/lib/marketing/catalog";
import styles from "./catalog.module.css";

export function ProductImage({ src, name, priority = false }: { src: string; name: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <Image src={src} alt={name} width={600} height={500} unoptimized priority={priority} sizes="(max-width: 700px) 90vw, 40vw" onError={() => setFailed(true)} /> : <div className={styles.imagePlaceholder}><Box size={66} strokeWidth={.7} /><span>PRODUCT IMAGE COMING SOON</span></div>;
}

export function CatalogCard({ product, index = 0 }: { product: CatalogProductCard; index?: number }) {
  return <article className={styles.card}>
    <Link href={`/catalog/${product.slug}`} className={styles.cardImage} aria-label={`View ${product.name}`}><span className={styles.figure}>FIG. {String(index + 1).padStart(2, "0")} / {product.type}</span><ProductImage src={product.image} name={product.name} /><span className={styles.imageArrow}><ArrowUpRight size={23} /></span></Link>
    <div className={styles.cardBody}><span className={styles.eyebrow}>{product.cat}</span><h3><Link href={`/catalog/${product.slug}`}>{product.name}</Link></h3><p>{product.description}</p><div className={styles.cardSpecs}>{product.ip && <span>{product.ip}</span>}{product.group && <span>{product.group}</span>}<span>{product.variantCount} {product.variantCount === 1 ? "variant" : "variants"}</span></div><Link className={styles.cardLink} href={`/catalog/${product.slug}`}>EXPLORE PRODUCT <ArrowUpRight size={17} /></Link></div>
  </article>;
}
