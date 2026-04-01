export const STOCK_ADJUSTMENT_MOVEMENT_TYPES = [
  "ADJUST_IN",
  "ADJUST_OUT",
  "SCRAP_OUT",
  "RETURN_IN",
  "RETURN_OUT",
  "IN",
  "OUT",
] as const;

export type StockAdjustmentMovementType =
  (typeof STOCK_ADJUSTMENT_MOVEMENT_TYPES)[number];

export const STOCK_ADJUSTMENT_MOVEMENT_LABELS: Record<
  StockAdjustmentMovementType,
  string
> = {
  ADJUST_IN: "Adjust In",
  ADJUST_OUT: "Adjust Out",
  SCRAP_OUT: "Scrap Out",
  RETURN_IN: "Return In",
  RETURN_OUT: "Return Out",
  IN: "In",
  OUT: "Out",
};

export const OUTWARD_STOCK_ADJUSTMENT_MOVEMENTS = new Set<
  StockAdjustmentMovementType
>(["ADJUST_OUT", "SCRAP_OUT", "RETURN_OUT", "OUT"]);

export function isStockAdjustmentMovementType(
  value: string,
): value is StockAdjustmentMovementType {
  return (STOCK_ADJUSTMENT_MOVEMENT_TYPES as readonly string[]).includes(value);
}
