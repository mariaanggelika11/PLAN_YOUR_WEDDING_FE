"use client";
import { useState } from "react";
import { ChevronDown, UploadCloud } from "lucide-react";
import { cn } from "@/utils/cn";

export function Tabs({ items }: { items: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-1 overflow-x-auto rounded-2xl border bg-white p-1.5">
        {items.map((item, index) => (
          <button
            onClick={() => setActive(index)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold",
              active === index ? "bg-ink text-white" : "text-stone-500 hover:bg-stone-50",
            )}
            key={item.label}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-5">{items[active].content}</div>
    </div>
  );
}
export function Stepper({
  steps,
  active = 0,
  onStepChange,
}: {
  steps: string[];
  active?: number;
  onStepChange?: (step: number) => void;
}) {
  return (
    <ol
      className={cn(
        "grid grid-cols-2 gap-2 rounded-2xl border bg-white p-3 sm:grid-cols-3 lg:grid-cols-4",
        steps.length > 4 && "xl:grid-cols-7",
      )}
    >
      {steps.map((step, index) => (
        <li key={step}>
          <button
            aria-current={index === active ? "step" : undefined}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition",
              index === active
                ? "bg-rose-50 text-blush"
                : "text-stone-400 hover:bg-stone-50 hover:text-stone-600",
              onStepChange &&
                "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush",
            )}
            disabled={!onStepChange}
            onClick={() => onStepChange?.(index)}
            type="button"
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border",
                index <= active && "border-current",
              )}
            >
              {index + 1}
            </span>
            {step}
          </button>
        </li>
      ))}
    </ol>
  );
}
export function Accordion({ items }: { items: { title: string; content: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      {items.map((item, index) => (
        <section className="border-b last:border-0" key={item.title}>
          <button
            onClick={() => setOpen(open === index ? -1 : index)}
            className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold"
          >
            {item.title}
            <ChevronDown className={cn("transition", open === index && "rotate-180")} size={17} />
          </button>
          {open === index && (
            <p className="px-5 pb-5 text-sm leading-6 text-stone-500">{item.content}</p>
          )}
        </section>
      ))}
    </div>
  );
}
export function DragDropUpload() {
  const [file, setFile] = useState("");
  return (
    <label className="grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed bg-stone-50 p-8 text-center hover:border-blush hover:bg-rose-50">
      <input
        className="sr-only"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")}
      />
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-blush shadow-sm">
        <UploadCloud />
      </span>
      <span className="mt-4 text-sm font-semibold">
        {file || "Tarik file ke sini atau klik untuk memilih"}
      </span>
      <span className="mt-1 text-xs text-stone-500">JPG, PNG, atau PDF maksimal 5 MB</span>
      {file && (
        <span className="mt-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          File siap diunggah
        </span>
      )}
    </label>
  );
}
