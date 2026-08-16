import { CustomerLayout } from "@/shared/components/layout/AppLayouts";
import type { ReactNode } from "react";
export default function Layout({ children }: { children: ReactNode }) {
  return <CustomerLayout>{children}</CustomerLayout>;
}
