"use client";

import { useEffect, useState } from "react";
import { AppInput, AppSelect } from "@/components/ui/FormFields";
import { getCities, getProvinces, type RegionOption } from "@/services/regionService";

export function RegionFields({
  initialCity = "",
  initialProvince = "",
}: {
  initialCity?: string;
  initialProvince?: string;
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
        <AppInput defaultValue={initialProvince} label="Provinsi" name="province" />
        <AppInput defaultValue={initialCity} label="Kabupaten/Kota" name="city" />
      </>
    );
  }

  return (
    <>
      <AppSelect
        label="Provinsi"
        name="province"
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
        label="Kabupaten/Kota"
        name="city"
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
