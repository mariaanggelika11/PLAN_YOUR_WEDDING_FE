"use client";

import { useTranslation } from "@/shared/i18n/useTranslation";
import { cn } from "@/shared/utils/cn";
import { ChevronDown, UploadCloud } from "lucide-react";
import { useId, useRef, useState } from "react";

export function Tabs({ items }: { items: { label: string; content: React.ReactNode }[] }) {
  const { translateText } = useTranslation();

  const [active, setActive] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="min-w-0">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b bg-transparent">
        {items.map((item, index) => (
          <button
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % items.length
                  : event.key === "ArrowLeft"
                    ? (index - 1 + items.length) % items.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? items.length - 1
                        : undefined;
              if (next === undefined) return;
              event.preventDefault();
              setActive(next);
              buttons.current[next]?.focus();
            }}
            onClick={() => setActive(index)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium",
              active === index
                ? "border-blush text-blush"
                : "border-transparent text-stone-600 hover:text-ink",
            )}
            key={item.label}
          >
            {translateText(item.label)}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.label}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          tabIndex={0}
          hidden={active !== index}
          className="mt-5"
        >
          {active === index ? item.content : null}
        </div>
      ))}
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
  const { translateText } = useTranslation();
  return (
    <ol
      className={cn(
        "grid grid-cols-1 gap-2 rounded-xl border bg-white p-3 min-[375px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
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
                : "text-stone-600 hover:bg-stone-50 hover:text-stone-600",
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
            {translateText(step)}
          </button>
        </li>
      ))}
    </ol>
  );
}
export function Accordion({ items }: { items: { title: string; content: string }[] }) {
  const { translateText } = useTranslation();
  const [open, setOpen] = useState(0);
  const id = useId();
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      {items.map((item, index) => (
        <section className="border-b last:border-0" key={item.title}>
          <h3>
            <button
              type="button"
              id={`${id}-heading-${index}`}
              aria-controls={`${id}-content-${index}`}
              aria-expanded={open === index}
              onClick={() => setOpen(open === index ? -1 : index)}
              className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold"
            >
              {translateText(item.title)}
              <ChevronDown
                aria-hidden="true"
                className={cn("transition", open === index && "rotate-180")}
                size={17}
              />
            </button>
          </h3>
          <p
            id={`${id}-content-${index}`}
            hidden={open !== index}
            className="px-5 pb-5 text-sm leading-6 text-stone-600"
          >
            {translateText(item.content)}
          </p>
        </section>
      ))}
    </div>
  );
}
export function DragDropUpload() {
  const { translateText } = useTranslation();
  const [file, setFile] = useState("");
  return (
    <label className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed bg-stone-50 p-8 text-center hover:border-blush hover:bg-rose-50">
      <input
        className="sr-only"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")}
      />
      <span className="grid size-12 place-items-center rounded-xl bg-white text-blush shadow-sm">
        <UploadCloud />
      </span>
      <span className="mt-4 text-sm font-semibold">
        {file || translateText("Tarik file ke sini atau klik untuk memilih")}
      </span>
      <span className="mt-1 text-xs text-stone-600">
        {translateText("JPG, PNG, atau PDF maksimal 5 MB")}
      </span>
      {file && (
        <span className="mt-4 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          {translateText("File siap diunggah")}{" "}
        </span>
      )}
    </label>
  );
}
