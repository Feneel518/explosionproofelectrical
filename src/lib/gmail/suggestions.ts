/** Shared, deterministic matching for mail and purchase-document review. */
export function normalizeMatch(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/(\d)\s+(w|kw|v|a|hp)\b/g, "$1$2").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

const ignoredWords = new Set("the and for with from please kindly required request enquiry inquiry quotation order purchase document number limited ltd pvt private company dear regards hello flp wp flameproof explosion proof electrical nos qty pcs sales team email com www".split(" "));
export function matchWords(value: string) {
  return [...new Set(normalizeMatch(value).split(" ").filter(word => word.length > 2 && !ignoredWords.has(word)))];
}

export function mailSearchHints(subject: string, sender: string, body: string) {
  const text = `${subject}\n${body}`;
  const poNumbers = [...text.matchAll(/\b(?:p\.?\s*o\.?|purchase\s+(?:order|doc(?:ument)?))\s*(?:(?:no\.?|number|reference|ref\.?)\s*)?[:#=\-]?\s*((?=[a-z0-9/_.-]*\d)[a-z0-9][a-z0-9/_.-]*)/gi)]
    .map(match => match[1].replace(/[.,;]+$/, ""));
  const email = sender.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0]?.toLowerCase() ?? "";
  const names = [...text.matchAll(/(?:^|\n)\s*(?:company|customer|client|buyer|bill\s*to|sold\s*to)\s*[:\-]\s*([^\n]+)/gi)].map(match => match[1]);
  const nameWords = matchWords(`${sender.replace(/<[^>]*>/g, "")} ${email.split("@")[1]?.split(".")[0] ?? ""} ${subject} ${names.join(" ")} ${body.slice(0, 4000)}`).filter(word => /\p{L}/u.test(word));
  return { text: `${subject}\n${sender}\n${body}`, email, poNumbers: [...new Set(poNumbers)].slice(0, 12), nameWords: nameWords.slice(0, 40) };
}

type RecordIdentity = { clientName?: string | null; clientNameSnapshot?: string | null; receivedFromName?: string | null; receivedFromEmail?: string | null; poNumber?: string | null; customer?: { companyName: string; companyEmail?: string | null } | null };
export function scoreSalesRecord(record: RecordIdentity, hints: ReturnType<typeof mailSearchHints>) {
  const reasons: string[] = [];
  let score = 0;
  const text = ` ${normalizeMatch(hints.text)} `;
  const po = normalizeMatch(record.poNumber ?? "");
  const compact = (value: string) => normalizeMatch(value).replace(/ /g, "");
  if (po && ((compact(po).length >= 4 && text.includes(` ${po} `)) || hints.poNumbers.some(number => compact(number) === compact(po)))) {
    score += 200; reasons.push(`PO ${record.poNumber}`);
  }
  if (hints.email && [record.receivedFromEmail, record.customer?.companyEmail].some(email => email?.toLowerCase() === hints.email)) {
    score += 100; reasons.push("Sender email");
  }
  const names = [record.clientName, record.clientNameSnapshot, record.customer?.companyName, record.receivedFromName].filter((name): name is string => !!name);
  let nameScore = 0;
  for (const name of names) {
    const words = matchWords(name);
    const matched = words.filter(word => text.includes(` ${word} `));
    if (matched.length) nameScore = Math.max(nameScore, Math.round(60 * matched.length / words.length));
  }
  if (nameScore >= 20) { score += nameScore; reasons.push("Customer / contact name"); }
  return { score, reasons };
}

export type CatalogSuggestion = {
  productId: string; variantId: string | null; productName: string; variantName: string | null;
  sku: string | null; typeNumber: string | null; rating: string | null;
  productAliases?: string[]; variantAliases?: string[];
};
export type RankedCatalogSuggestion = CatalogSuggestion & { score: number; reasons: string[] };
export type ProductSuggestionRow = { description: string; suggestions: RankedCatalogSuggestion[] };

function hasPhrase(text: string, value: string | null) {
  if (!value) return false;
  const phrase = normalizeMatch(value);
  return !!phrase && new RegExp(`(?:^| )${phrase.split(" ").join(" *")}(?: |$)`, "u").test(text);
}

export function rankCatalogSuggestions(description: string, catalog: CatalogSuggestion[]): RankedCatalogSuggestion[] {
  const text = normalizeMatch(description);
  const words = new Set(matchWords(description));
  const ratings = text.match(/\b\d+(?:\s+\d+)?(?:kw|w|hp)\b/g) ?? [];
  return catalog.map(item => {
    let score = 0;
    const reasons: string[] = [];
    for (const [value, points, reason] of [[item.sku, 140, "SKU"], [item.typeNumber, 100, "Type number"], [item.variantName, 75, "Variant name"], [item.productName, 60, "Product name"]] as const) {
      const aliases = reason === "Product name" ? item.productAliases : reason === "Variant name" ? item.variantAliases : [];
      if ([value, ...(aliases ?? [])].some(label => hasPhrase(text, label))) { score += points; reasons.push(reason); }
    }
    const overlapScore = Math.max(...[item.productName, ...(item.productAliases ?? [])].map(name => {
      const productWords = matchWords(name);
      return productWords.length ? Math.round(45 * productWords.filter(word => words.has(word)).length / productWords.length) : 0;
    }));
    if (overlapScore && !reasons.includes("Product name")) {
      score += overlapScore; reasons.push("Product description");
    }
    // A rating alone cannot identify a product family.
    if (score < 20) return { ...item, score: 0, reasons: [] };
    const variantWords = matchWords(item.variantName ?? "");
    score += Math.min(20, variantWords.filter(word => words.has(word)).length * 5);
    if (item.rating && hasPhrase(text, item.rating)) { score += 30; reasons.push("Rating"); }
    else if (ratings.length && item.rating && /\d\s*(?:k?w|hp)\b/i.test(item.rating)) score = 0;
    return { ...item, score, reasons };
  }).filter(item => item.score >= 20).sort((a, b) => b.score - a.score || a.productName.localeCompare(b.productName) || (a.variantName ?? "").localeCompare(b.variantName ?? "")).slice(0, 5);
}

export function suggestExtractedProducts(text: string, catalog: CatalogSuggestion[]): ProductSuggestionRow[] {
  const lines = [...new Set(text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length >= 4))];
  const rows: ProductSuggestionRow[] = [];
  for (const line of lines.slice(0, 1500)) {
    const suggestions = rankCatalogSuggestions(line, catalog);
    if (suggestions.length) rows.push({ description: line.slice(0, 1000), suggestions });
    if (rows.length === 40) break;
  }
  return rows;
}
