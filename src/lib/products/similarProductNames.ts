export type ProductNameCandidate = {
  id: string;
  kind: "product" | "pending";
  name: string;
  aliases: string[];
  categoryId: string | null;
  categoryName: string | null;
  variantCount: number | null;
  status: string;
};

export type SimilarProductName = Omit<ProductNameCandidate, "aliases"> & {
  matchedAlias: string | null;
  exact: boolean;
};

const ignoredWords = new Set(["flp", "wp", "non", "flameproof", "weatherproof", "explosionproof", "exec", "product", "products", "fitting", "fittings", "unit", "units", "type"]);

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/wellglass/g, "well glass").replace(/bulkhead/g, "bulk head")
    .replace(/floodlight/g, "flood light").replace(/streetlight/g, "street light")
    .replace(/tubelight/g, "tube light").replace(/cleanroom/g, "clean room")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function productNameSearchTerms(value: string): string[] {
  return [...new Set(normalize(value).split(/\s+/).filter(word => word.length >= 2 && !ignoredWords.has(word)))].slice(0, 8);
}

function protection(value: string): "flp" | "non-flp" | null {
  const normalized = normalize(value);
  if (/\bnon flp\b/.test(normalized)) return "non-flp";
  return /\b(flp|flameproof|explosionproof)\b/.test(normalized) ? "flp" : null;
}

/** Small edit-distance check for misspelled words, never for numeric specifications. */
function closeWord(a: string, b: string): boolean {
  if (a.length < 4 || /\d/.test(a + b) || Math.abs(a.length - b.length) > 1) return false;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row++) {
    const current = [row];
    for (let col = 1; col <= b.length; col++) {
      current[col] = Math.min(current[col - 1] + 1, previous[col] + 1, previous[col - 1] + (a[row - 1] === b[col - 1] ? 0 : 1));
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length] <= 1;
}

function similarity(query: string, name: string): { score: number; exact: boolean } | null {
  const queryWords = productNameSearchTerms(query);
  const nameWords = productNameSearchTerms(name);
  if (!queryWords.length || !nameWords.length) return null;
  const exact = normalize(query) === normalize(name);
  const compactMatch = nameWords.join("").includes(queryWords.join(""));
  let matched = 0;
  let quality = 0;
  for (const word of queryWords) {
    const best = Math.max(0, ...nameWords.map(candidate => candidate === word ? 1
      : candidate.startsWith(word) ? 0.9
      : closeWord(word, candidate) ? 0.75 : 0));
    if (best) matched++;
    quality += best;
  }
  if (!exact && !compactMatch && matched / queryWords.length < 0.65) return null;
  const queryProtection = protection(query);
  const nameProtection = protection(name);
  const scopeAdjustment = queryProtection && nameProtection ? (queryProtection === nameProtection ? 30 : -80) : 0;
  return {
    exact,
    score: (exact ? 1000 : compactMatch ? 700 : 400) + quality / queryWords.length * 100 + scopeAdjustment,
  };
}

export function rankSimilarProductNames(query: string, candidates: ProductNameCandidate[], categoryId?: string): SimilarProductName[] {
  if (!productNameSearchTerms(query).length) return [];
  return candidates.flatMap(candidate => {
    const matches = [candidate.name, ...candidate.aliases].flatMap(name => {
      const match = similarity(query, name);
      return match ? [{ ...match, name }] : [];
    }).sort((a, b) => b.score - a.score);
    if (!matches.length) return [];
    const best = matches[0];
    const item: SimilarProductName = {
      id: candidate.id, kind: candidate.kind, name: candidate.name,
      categoryId: candidate.categoryId, categoryName: candidate.categoryName,
      variantCount: candidate.variantCount, status: candidate.status,
      matchedAlias: best.name === candidate.name ? null : best.name, exact: best.exact,
    };
    return [{ item, score: best.score + (categoryId && candidate.categoryId === categoryId ? 15 : 0) }];
  }).sort((a, b) => b.score - a.score || (a.item.kind === b.item.kind ? 0 : a.item.kind === "product" ? -1 : 1) || a.item.name.localeCompare(b.item.name) || a.item.id.localeCompare(b.item.id))
    .slice(0, 5).map(({ item }) => item);
}
