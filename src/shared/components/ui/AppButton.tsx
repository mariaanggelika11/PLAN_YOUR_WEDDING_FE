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
  const styles = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50",
    {
      "bg-blush text-white shadow-rose-200 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lg":
        variant === "primary",
      "border border-stone-200 bg-white text-ink hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50":
        variant === "secondary",
      "border border-stone-300 bg-transparent text-ink hover:border-blush hover:text-blush":
        variant === "outline",
      "text-stone-600 hover:bg-stone-100": variant === "ghost",
      "bg-emerald-600 text-white shadow-emerald-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg":
        variant === "success",
      "bg-red-600 text-white hover:bg-red-700": variant === "danger",
    },
    className,
  );
  if (asChild)
    return (
      <Slot className={styles} {...props}>
        {children}
      </Slot>
    );
  return (
    <button className={styles} disabled={disabled || loading} {...props}>
      {loading && <LoaderCircle className="animate-spin" size={16} />}
      {children}
    </button>
  );
}
