import type { ReactNode } from "react";
import { CustomerLayout } from "@/layouts/Layouts";
export default function Layout({ children }: { children: ReactNode }) {
  return <CustomerLayout>{children}</CustomerLayout>;
}
