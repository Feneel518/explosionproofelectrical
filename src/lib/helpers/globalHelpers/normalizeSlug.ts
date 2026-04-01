export function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function slugToSku(str: string) {
  return str
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

/**
 * Build base SKU from product + variant
 */
export function buildBaseSku(productName: string, variantName: string) {
  const productPart = slugToSku(productName);
  const variantPart = slugToSku(variantName);

  return `${productPart}-${variantPart}`;
}
