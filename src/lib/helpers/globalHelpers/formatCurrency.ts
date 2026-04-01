export function formatCurrencyINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2, // 👈 ensures .00
    maximumFractionDigits: 2, // 👈 locks it to 2 decimals
  }).format(value ?? 0);
}
