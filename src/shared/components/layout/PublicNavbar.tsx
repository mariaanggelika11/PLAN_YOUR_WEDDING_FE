"use client";

import { BrandMark } from "@/shared/components/BrandMark";
import { AppButton } from "@/shared/components/ui/AppButton";
import { PUBLIC_NAVIGATION } from "@/shared/config/navigation";
import { ROUTES } from "@/shared/config/routes";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";

export function PublicNavbar() {
  // TODO API: Cek status login user untuk menampilkan menu yang sesuai
  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-xl lg:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <BrandMark />
        <div className="hidden items-center gap-7 text-sm font-medium text-stone-600 lg:flex">
          {PUBLIC_NAVIGATION.map((item) => (
            <Link className="hover:text-blush" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            aria-label="Cari vendor"
            className="hidden size-10 place-items-center rounded-lg border bg-white text-stone-500 hover:border-blush hover:text-blush sm:grid"
            href={ROUTES.customer.marketplace}
          >
            <Search size={17} />
          </Link>
          <AppButton
            asChild
            variant="secondary"
            className="hidden h-10 min-h-10 min-w-24 rounded-lg px-5 sm:inline-flex"
          >
            <Link href={ROUTES.login}>Masuk</Link>
          </AppButton>
          <AppButton
            asChild
            className="hidden h-10 min-h-10 min-w-24 rounded-lg px-5  sm:inline-flex"
          >
            <Link href={ROUTES.homeRegister}>Daftar</Link>
          </AppButton>
          <MobilePublicMenu />
        </div>
      </div>
    </nav>
  );
}

function MobilePublicMenu() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          aria-label="Buka menu"
          className="grid size-10 place-items-center rounded-lg border bg-white lg:hidden"
        >
          <Menu size={18} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,380px)] flex-col overflow-y-auto bg-white p-4 shadow-overlay">
          <Dialog.Title className="sr-only">Menu navigasi</Dialog.Title>
          <Dialog.Description className="sr-only">
            Pilih halaman atau masuk ke akun Plan Your Wedding.
          </Dialog.Description>
          <div className="flex items-center justify-between gap-3">
            <BrandMark />
            <Dialog.Close
              aria-label="Tutup menu"
              className="grid size-10 place-items-center rounded-lg bg-stone-100"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[.2em] text-stone-400">
            Navigasi
          </p>
          <nav className="mt-3 grid gap-1">
            {PUBLIC_NAVIGATION.map((item) => (
              <Dialog.Close asChild key={item.href}>
                <Link
                  className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-rose-50 hover:text-blush"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </Dialog.Close>
            ))}
          </nav>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <AppButton asChild variant="secondary" className="w-full">
              <Link href={ROUTES.login}>Masuk</Link>
            </AppButton>
            <AppButton asChild className="w-full">
              <Link href={ROUTES.homeRegister}>Daftar</Link>
            </AppButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
