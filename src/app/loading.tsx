import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("errors");
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-[50vh] place-items-center p-6 text-stone-600"
    >
      {t("loading")}
    </div>
  );
}
