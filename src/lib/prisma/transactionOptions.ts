export const FINALIZE_TRANSACTION_OPTIONS = {
  maxWait: 20_000,
  timeout: 60_000,
  isolationLevel: "Serializable",
} as const;
