export function formatCurrency(value: number, locale: "id" | "en" = "id") {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
