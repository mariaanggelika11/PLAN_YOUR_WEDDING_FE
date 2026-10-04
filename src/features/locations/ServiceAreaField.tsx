"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getCities, getProvinces, type RegionOption } from "@/shared/api/regionApi";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { SearchableSelect } from "@/shared/components/ui/SearchableSelect";
import { parseServiceAreas, serializeServiceAreas } from "./serviceAreas";

export function ServiceAreaField({
  name,
  initialValue = "",
  businessArea,
  disabled = false,
  onDirty,
}: {
  name: string;
  initialValue?: string | null;
  businessArea?: string | null;
  disabled?: boolean;
  onDirty?: () => void;
}) {
  const business = parseServiceAreas(businessArea);
  const [useBusiness, setUseBusiness] = useState(!initialValue && business.length > 0);
  const [selected, setSelected] = useState(() => parseServiceAreas(initialValue));
  const [province, setProvince] = useState("");
  const useBusinessOptions = businessArea !== undefined && business.length > 0;
  const provinces = useAsyncResource(getProvinces, {
    initialData: [] as RegionOption[],
    autoLoad: !useBusinessOptions,
  });
  const loadCities = useCallback(
    () => (province ? getCities(province) : Promise.resolve([])),
    [province],
  );
  const cities = useAsyncResource(loadCities, { initialData: [] as RegionOption[] });
  const value = serializeServiceAreas(useBusiness ? business : selected);
  const control = useRef<HTMLSelectElement>(null);
  const previous = useRef(value);
  // A native select change bubbles to the enclosing form's unsaved-changes guard.
  useEffect(() => {
    if (previous.current !== value) {
      previous.current = value;
      control.current?.dispatchEvent(new Event("change", { bubbles: true }));
      onDirty?.();
    }
  }, [value, onDirty]);

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="text-sm font-medium">Area layanan</legend>
      <select ref={control} name={name} value={value} onChange={() => {}} hidden aria-hidden="true">
        <option value={value}>{value}</option>
      </select>
      <p className="text-xs text-stone-500">
        Pilih kota/kabupaten tempat acara yang bisa dilayani. Untuk venue, pilih lokasi venue
        berada.
      </p>
      {businessArea !== undefined && (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={useBusiness}
            disabled={disabled || !business.length}
            onChange={(event) => setUseBusiness(event.target.checked)}
            className="mt-1 accent-blush"
          />
          <span>
            Gunakan area layanan bisnis saat ini
            <span className="mt-1 block text-xs text-stone-500">
              {business.length
                ? "Disalin saat paket disimpan. Perubahan area bisnis berikutnya tidak otomatis mengubah paket."
                : "Isi area layanan di Profil Bisnis terlebih dahulu, atau pilih wilayah di bawah."}
            </span>
          </span>
        </label>
      )}
      {(useBusiness ? business : selected).length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Area layanan terpilih">
          {(useBusiness ? business : selected).map((area) => (
            <li
              key={area}
              className="flex max-w-full items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs"
            >
              <span className="break-words">{area}</span>
              {!useBusiness && (
                <button
                  type="button"
                  aria-label={`Hapus area ${area}`}
                  className="shrink-0 rounded p-1 hover:bg-stone-200"
                  onClick={() => setSelected((current) => current.filter((item) => item !== area))}
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!useBusiness && useBusinessOptions && (
        <SearchableSelect
          label="Pilih area khusus paket"
          value=""
          disabled={disabled}
          options={business
            .filter(
              (area) =>
                !selected.some(
                  (item) => item.toLocaleLowerCase("id") === area.toLocaleLowerCase("id"),
                ),
            )
            .map((area) => ({ value: area, label: area }))}
          onChange={(next) => {
            if (next) setSelected((current) => [...current, next]);
          }}
          placeholder="Pilih dari area layanan bisnis"
        />
      )}
      {!useBusiness && !useBusinessOptions && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SearchableSelect
            label="Provinsi area layanan"
            value={province}
            loading={provinces.loading}
            disabled={disabled}
            options={provinces.data.map((item) => ({ value: item.code, label: item.name }))}
            onChange={(next) => {
              cities.setData([]);
              setProvince(next);
            }}
            placeholder="Cari provinsi"
          />
          <SearchableSelect
            label="Tambah kota/kabupaten"
            value=""
            loading={cities.loading}
            disabled={disabled || !province || !cities.data.length || Boolean(cities.error)}
            options={cities.data
              .filter(
                (item) =>
                  !selected.some(
                    (area) => area.toLocaleLowerCase("id") === item.name.toLocaleLowerCase("id"),
                  ),
              )
              .map((item) => ({ value: item.name, label: item.name }))}
            onChange={(next) => {
              if (next) setSelected((current) => parseServiceAreas([...current, next].join(", ")));
            }}
            placeholder={province ? "Cari kota/kabupaten" : "Pilih provinsi dahulu"}
          />
        </div>
      )}
      {!useBusiness && !useBusinessOptions && (provinces.error || cities.error) && (
        <p role="alert" className="text-xs text-red-600">
          Pilihan wilayah gagal dimuat. Area yang sudah dipilih tetap tersimpan di formulir.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              void provinces.reload();
              void cities.reload();
            }}
          >
            Coba lagi
          </button>
        </p>
      )}
    </fieldset>
  );
}
