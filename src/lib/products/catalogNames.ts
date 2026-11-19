/** Current catalog names are deliberately separate from historical linked labels. */
export function catalogProductName(product: { name: string; displayName?: string | null }): string {
  return product.displayName?.trim() || product.name;
}

export function catalogVariantName(variant: { variant: string; displayName?: string | null }): string {
  return variant.displayName?.trim() || variant.variant;
}

export function catalogItemTitle(
  product: { name: string; displayName?: string | null },
  variant: { variant: string; displayName?: string | null },
): string {
  return [catalogProductName(product), catalogVariantName(variant)].filter(Boolean).join(" - ");
}

/** A saved line is authoritative, including custom wording and copied old quotations. */
export function documentItemTitle(item: {
  title?: string | null;
  product?: { name: string } | null;
  variant?: { variant: string } | null;
}): string {
  return item.title?.trim() || [item.product?.name, item.variant?.variant].filter(Boolean).join(" - ") || "Unnamed Product";
}
