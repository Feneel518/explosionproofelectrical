export const CONTRACTOR_WORKER_ROLES = [
  "TURNER",
  "ASSEMBLY",
  "POLISHING",
  "PAINTING",
  "HELPER",
  "OTHER",
] as const;

export const CONTRACTOR_CATALOG_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const WORKER_LEDGER_KINDS = [
  "ADVANCE",
  "DEDUCTION",
  "BONUS",
  "PAYOUT",
  "ADJUSTMENT",
] as const;
