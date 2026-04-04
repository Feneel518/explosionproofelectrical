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
        className: "bg-emerald-600 text-white hover:bg-emerald-600/90",
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
        className: "border-accent bg-accent text-accent-foreground",
      };
    case "DRAFT":
    default:
      return { variant: "secondary" };
  }
}
