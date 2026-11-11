"use client";
import { useTranslation } from "@/shared/i18n/useTranslation";

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
  const { translateText } = useTranslation();
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
      <legend className="text-sm font-medium">{translateText("Area layanan")}</legend>
      <select ref={control} name={name} value={value} onChange={() => {}} hidden aria-hidden="true">
        <option value={value}>{value}</option>
      </select>
      <p className="text-xs text-stone-600">
        {translateText(
          "Pilih kota/kabupaten tempat acara yang bisa dilayani. Untuk venue, pilih lokasi venue berada.",
        )}{" "}
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
            {translateText("Gunakan area layanan bisnis saat ini")}{" "}
            <span className="mt-1 block text-xs text-stone-600">
              {business.length
                ? translateText(
                    "Disalin saat paket disimpan. Perubahan area bisnis berikutnya tidak otomatis mengubah paket.",
                  )
                : translateText(
                    "Isi area layanan di Profil Bisnis terlebih dahulu, atau pilih wilayah di bawah.",
                  )}
            </span>
          </span>
        </label>
      )}
      {(useBusiness ? business : selected).length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={translateText("Area layanan terpilih")}>
          {(useBusiness ? business : selected).map((area) => (
            <li
              key={area}
              className="flex max-w-full items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs"
            >
              <span className="break-words">{area}</span>
              {!useBusiness && (
                <button
                  type="button"
                  aria-label={translateText("Hapus area {0}", { 0: area })}
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
          label={translateText("Pilih area khusus paket")}
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
          placeholder={translateText("Pilih dari area layanan bisnis")}
        />
      )}
      {!useBusiness && !useBusinessOptions && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SearchableSelect
            label={translateText("Provinsi area layanan")}
            value={province}
            loading={provinces.loading}
            disabled={disabled}
            options={provinces.data.map((item) => ({ value: item.code, label: item.name }))}
            onChange={(next) => {
              cities.setData([]);
              setProvince(next);
            }}
            placeholder={translateText("Cari provinsi")}
          />
          <SearchableSelect
            label={translateText("Tambah kota/kabupaten")}
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
            placeholder={
              province
                ? translateText("Cari kota/kabupaten")
                : translateText("Pilih provinsi dahulu")
            }
          />
        </div>
      )}
      {!useBusiness && !useBusinessOptions && (provinces.error || cities.error) && (
        <p role="alert" className="text-xs text-red-600">
          {translateText(
            "Pilihan wilayah gagal dimuat. Area yang sudah dipilih tetap tersimpan di formulir.",
          )}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              void provinces.reload();
              void cities.reload();
            }}
          >
            {translateText("Coba lagi")}{" "}
          </button>
        </p>
      )}
    </fieldset>
  );
}
