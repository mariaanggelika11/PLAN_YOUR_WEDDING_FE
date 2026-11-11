export function formatDate(value: string | Date, locale: "id" | "en" = "id") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", { dateStyle: "long" }).format(
    new Date(value),
  );
}

export function formatDateTime(value: string | Date, locale: "id" | "en" = "id") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}
