import type { ReactNode } from "react";
import { VendorLayout } from "@/layouts/Layouts";
export default function Layout({ children }: { children: ReactNode }) {
  return <VendorLayout>{children}</VendorLayout>;
}
