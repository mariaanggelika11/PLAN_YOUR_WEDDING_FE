import { cn } from "@/shared/utils/cn";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function AppIconButton({
  asChild,
  children,
  className,
  label,
  variant = "neutral",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: ReactNode;
  label: string;
  variant?: "neutral" | "danger";
}) {
  const styles = cn(
    "grid size-10 shrink-0 place-items-center rounded-xl border bg-white transition disabled:cursor-not-allowed disabled:opacity-50",
    variant === "danger"
      ? "border-red-200 text-red-600 hover:bg-red-50"
      : "border-stone-200 text-stone-600 hover:border-rose-200 hover:bg-rose-50 hover:text-blush",
    className,
  );
  if (asChild) {
    return (
      <Slot aria-label={label} className={styles} title={label}>
        {children}
      </Slot>
    );
  }
  return (
    <button aria-label={label} className={styles} title={label} type="button" {...props}>
      {children}
    </button>
  );
}
