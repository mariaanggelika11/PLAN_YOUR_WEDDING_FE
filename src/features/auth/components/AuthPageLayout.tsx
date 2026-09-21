import { BrandMark } from "@/shared/components/BrandMark";
import { ROUTES } from "@/shared/config/routes";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function AuthPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(320px,0.85fr)_1.15fr]">
      <aside className="hidden flex-col justify-between border-r bg-cream p-12 lg:flex xl:p-16">
        <BrandMark />
        <div className="max-w-md py-16">
          <p className="text-xs font-medium uppercase tracking-widest text-blush">
            Plan Your Wedding
          </p>
          <p className="mt-6 text-4xl font-medium leading-tight tracking-tight xl:text-5xl">
            Hari istimewa.
            <br />
            Rencana yang tertata.
          </p>
          <p className="mt-6 max-w-sm text-base leading-7 text-stone-600">
            Satu tempat untuk menemukan vendor, mengelola pesanan, dan menyiapkan pernikahan Anda.
          </p>
        </div>
        <p className="text-xs text-stone-500">Celebrate with confidence.</p>
      </aside>
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:p-12">
        <Link
          href={ROUTES.home}
          className="inline-flex w-fit items-center gap-2 text-sm text-stone-600 hover:text-blush"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda
        </Link>
        <div className="mx-auto my-auto w-full max-w-md py-10 sm:py-12">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <h1 className="page-heading">{title}</h1>
          <p className="mb-8 mt-3 text-sm leading-6 text-stone-500">{description}</p>
          <div className="grid gap-5">{children}</div>
        </div>
      </div>
    </main>
  );
}
