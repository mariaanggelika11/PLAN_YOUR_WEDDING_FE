import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="grid min-h-screen place-items-center bg-stone-50 px-5 py-12"
    >
      <section className="max-w-lg text-center">
        <p className="font-semibold text-rose-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold">{t("notFoundTitle")}</h1>
        <p className="mt-3 text-stone-600">{t("notFoundDescription")}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-rose-700 px-5 py-3 font-medium text-white"
        >
          {t("home")}
        </Link>
      </section>
    </main>
  );
}
