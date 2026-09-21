"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import { Slot } from "@radix-ui/react-slot";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";
  loading?: boolean;
}

export function AppButton({
  asChild,
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: AppButtonProps) {
  const { translateText } = useTranslation();
  const translatedChildren = typeof children === "string" ? translateText(children) : children;
  const styles = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors duration-150 [&>svg]:shrink-0 disabled:cursor-not-allowed disabled:opacity-50",
    {
      "bg-blush text-white hover:bg-rose-700": variant === "primary",
      "border border-stone-200 bg-white text-ink hover:border-rose-200 hover:bg-rose-50":
        variant === "secondary",
      "border border-stone-300 bg-transparent text-ink hover:border-blush hover:text-blush":
        variant === "outline",
      "text-stone-600 hover:bg-stone-100": variant === "ghost",
      "bg-emerald-700 text-white hover:bg-emerald-800": variant === "success",
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100": variant === "danger",
    },
    className,
  );
  if (asChild)
    return (
      <Slot className={styles} {...props}>
        {translatedChildren}
      </Slot>
    );
  return (
    <button className={styles} disabled={disabled || loading} {...props}>
      {loading && <LoaderCircle className="animate-spin" size={16} />}
      {translatedChildren}
    </button>
  );
}
