type SalesOrderBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "ghost"
  | "link";

export function getSalesOrderStatusBadge(status: string): {
  variant: SalesOrderBadgeVariant;
  className?: string;
} {
  switch (status) {
    case "COMPLETED":
      return {
        variant: "default",
        className:
          "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600/90",
      };
    case "INVOICED":
    case "DISPATCHED":
      return { variant: "default" };
    case "CANCELLED":
      return { variant: "destructive" };
    case "IN_PRODUCTION":
    case "PARTIALLY_DISPATCHED":
    case "PARTIALLY_INVOICED":
      return { variant: "outline" };
    case "CONFIRMED":
      return {
        variant: "outline",
        className: "border-blue-600 bg-blue-600 text-white",
      };
    case "DRAFT":
      return {
        variant: "outline",
        className:
          "border-slate-300 bg-white text-slate-900 shadow-sm dark:border-slate-300 dark:bg-white dark:text-slate-900",
      };
    default:
      return { variant: "secondary" };
  }
}
