"use client";

import { ChevronDown, X } from "lucide-react";
import { useId, useRef, useState } from "react";

export interface SearchOption {
  value: string;
  label: string;
}

/** Selection-only combobox: typing searches options without changing the saved value. */
export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Pilih wilayah",
  disabled = false,
  loading = false,
  clearable = true,
}: {
  label: string;
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = options.filter((option) =>
    option.label.toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id")),
  );
  const selected = options.find((option) => option.value === value);
  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }
  return (
    <div
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setQuery("");
        }
      }}
    >
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          ref={input}
          id={id}
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${id}-option-${active}` : undefined}
          className="field-control pr-16"
          disabled={disabled || loading}
          placeholder={loading ? "Memuat wilayah…" : placeholder}
          value={open ? query : (selected?.label ?? value)}
          onClick={() => {
            setOpen(true);
            setActive(0);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              setQuery("");
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              const next = !open
                ? 0
                : Math.max(
                    0,
                    Math.min(filtered.length - 1, active + (event.key === "ArrowDown" ? 1 : -1)),
                  );
              setActive(next);
              document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: "nearest" });
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (open && filtered[active]) choose(filtered[active].value);
              else setOpen(true);
            }
          }}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {clearable && value && (
            <button
              type="button"
              disabled={disabled || loading}
              aria-label={`Hapus ${label.toLowerCase()}`}
              className="rounded p-1 hover:bg-stone-100"
              onClick={() => {
                choose("");
                input.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown size={16} className="pointer-events-none text-stone-400" />
        </div>
      </div>
      {open && !disabled && !loading && (
        <ul
          id={`${id}-options`}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-white p-1 shadow-lg"
        >
          {filtered.length ? (
            filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={value === option.value}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${active === index ? "bg-rose-50 text-blush" : "hover:bg-stone-50"}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li role="presentation" className="px-3 py-2 text-sm text-stone-500">
              Wilayah tidak ditemukan.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
