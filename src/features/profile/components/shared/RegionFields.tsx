"use client";

import { getCities, getProvinces, type RegionOption } from "@/shared/api/regionApi";
import { AppInput, AppSelect } from "@/shared/components/ui/FormFields";
import { useEffect, useState } from "react";

export function RegionFields({
  cityLabel = "Kabupaten/Kota",
  cityName = "city",
  initialCity = "",
  initialProvince = "",
  provinceLabel = "Provinsi",
  provinceName = "province",
}: {
  cityLabel?: string;
  cityName?: string;
  initialCity?: string;
  initialProvince?: string;
  provinceLabel?: string;
  provinceName?: string;
}) {
  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<RegionOption[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [province, setProvince] = useState(initialProvince);
  const [city, setCity] = useState(initialCity);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getProvinces()
      .then((items) => {
        setProvinces(items);
        const selected = items.find((item) => item.name === initialProvince);
        if (selected) setProvinceCode(selected.code);
      })
      .catch(() => setFailed(true));
  }, [initialProvince]);

  useEffect(() => {
    if (!provinceCode) {
      setCities([]);
      return;
    }
    getCities(provinceCode)
      .then(setCities)
      .catch(() => setFailed(true));
  }, [provinceCode]);

  if (failed) {
    return (
      <>
        <AppInput defaultValue={initialProvince} label={provinceLabel} name={provinceName} />
        <AppInput defaultValue={initialCity} label={cityLabel} name={cityName} />
      </>
    );
  }

  return (
    <>
      <AppSelect
        label={provinceLabel}
        name={provinceName}
        onChange={(event) => {
          const option = provinces.find((item) => item.name === event.target.value);
          setProvince(event.target.value);
          setProvinceCode(option?.code ?? "");
          setCity("");
        }}
        value={province}
      >
        <option value="">Pilih provinsi</option>
        {provinces.map((item) => (
          <option key={item.code} value={item.name}>
            {item.name}
          </option>
        ))}
      </AppSelect>
      <AppSelect
        disabled={!provinceCode}
        label={cityLabel}
        name={cityName}
        onChange={(event) => setCity(event.target.value)}
        value={city}
      >
        <option value="">{provinceCode ? "Pilih kabupaten/kota" : "Pilih provinsi dahulu"}</option>
        {cities.map((item) => (
          <option key={item.code} value={item.name}>
            {item.name}
          </option>
        ))}
      </AppSelect>
    </>
  );
}
