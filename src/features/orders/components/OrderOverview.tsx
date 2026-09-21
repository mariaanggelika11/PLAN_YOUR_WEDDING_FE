import type { ReactNode } from "react";
import { OrderTimeline, type OrderTimelineItem } from "@/shared/components/data-display/Commerce";
import { DetailGrid } from "@/shared/components/data-display/DetailBlocks";
import { SectionHeader } from "@/shared/components/data-display/SectionHeaders";

/** Shared customer/vendor presentation; callers keep their role-specific data and actions. */
export function OrderOverview({
  details,
  timeline,
  paymentSummary,
}: {
  details: [string, ReactNode][];
  timeline: OrderTimelineItem[];
  paymentSummary: ReactNode;
}) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 content-start gap-6">
        <DetailGrid title="Detail acara" items={details} />
        {paymentSummary}
      </div>
      <section className="min-w-0 rounded-xl border bg-white p-5 sm:p-6">
        <SectionHeader title="Timeline pesanan" />
        <div className="mt-5">
          <OrderTimeline items={timeline} />
        </div>
      </section>
    </div>
  );
}
