import Link from "next/link";
export function AuthPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-soft">
        <Link href="/" className="text-sm font-semibold text-blush">
          ← Kembali ke beranda
        </Link>
        <h1 className="mt-7 text-3xl font-semibold">{title}</h1>
        <p className="mb-7 mt-2 text-sm text-stone-500">{description}</p>
        <div className="grid gap-5">{children}</div>
      </div>
    </main>
  );
}
