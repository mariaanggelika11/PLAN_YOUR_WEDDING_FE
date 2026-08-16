"use client";

import { AppShell } from "@/shared/components/layout/AppShell";
import {
  ADMIN_NAVIGATION,
  CUSTOMER_NAVIGATION,
  ROLE_LABELS,
  VENDOR_NAVIGATION,
} from "@/shared/config/navigation";
import type { ReactNode } from "react";

// TODO API: Validasi session user dan role dari backend/auth provider
export function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell role="customer" label={ROLE_LABELS.customer} nav={CUSTOMER_NAVIGATION}>
      {children}
    </AppShell>
  );
}

// TODO API: Validasi apakah vendor sudah Verified / Active sebelum membuka Seller Center
export function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell role="vendor" label={ROLE_LABELS.vendor} nav={VENDOR_NAVIGATION}>
      {children}
    </AppShell>
  );
}

// TODO API: Validasi role admin dari backend
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell role="admin" label={ROLE_LABELS.admin} nav={ADMIN_NAVIGATION}>
      {children}
    </AppShell>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
