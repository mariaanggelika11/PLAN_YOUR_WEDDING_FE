import { PageHeader } from "@/shared/components/data-display/SectionHeaders";
import type { ReactNode } from "react";

interface FeaturePageProps {
  title: string;
  description: string;
  children: ReactNode;
  showHeader?: boolean;
}

export function FeaturePage({ title, description, children, showHeader = true }: FeaturePageProps) {
  return (
    <div className="grid gap-7">
      {showHeader && <PageHeader title={title} description={description} />}
      {children}
    </div>
  );
}
