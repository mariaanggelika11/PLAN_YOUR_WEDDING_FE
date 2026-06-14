import type { ReactNode } from "react";
import { AdminLayout } from "@/layouts/Layouts";
export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
