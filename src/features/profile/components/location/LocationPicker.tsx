"use client";

import type {
  Coordinates,
  LocationSearchResult,
} from "@/features/profile/components/location/types";
import { isValidCoordinates } from "@/features/profile/components/location/types";
import { LocateFixed, MapPin, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState, type KeyboardEvent } from "react";

const DEFAULT_LOCATION: Coordinates = { latitude: -6.2, longitude: 106.816666 };
const LocationMap = dynamic(() => import("./LocationMap"), {
  loading: () => <div className="h-72 animate-pulse bg-stone-100" />,
  ssr: false,
});

export function LocationPicker({
  initialLatitude,
  initialLongitude,
}: {
  initialLatitude: number | string;
  initialLongitude: number | string;
}) {
  const initialCoordinates = parseCoordinates(initialLatitude, initialLongitude);
  const [location, setLocation] = useState<Coordinates>(
    () => initialCoordinates ?? DEFAULT_LOCATION,
  );
  const [selected, setSelected] = useState(Boolean(initialCoordinates));
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const coordinates = parseCoordinates(initialLatitude, initialLongitude);
    if (!coordinates) return;
    setLocation(coordinates);
    setSelected(true);
  }, [initialLatitude, initialLongitude]);

  function chooseLocation(value: Coordinates) {
    if (!isValidCoordinates(value)) {
      setMessage("Koordinat lokasi tidak valid.");
      return;
    }
    setLocation(value);
    setSelected(true);
    setResults([]);
    setMessage("");
  }

  async function search() {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setMessage("Masukkan minimal 3 karakter.");
      return;
    }
    setSearching(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(normalizedQuery)}`,
      );
      const payload = (await response.json()) as {
        data?: LocationSearchResult[];
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message);
      const validResults = (payload.data ?? []).filter(isValidCoordinates);
      setResults(validResults);
      if (!validResults.length) setMessage("Lokasi tidak ditemukan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lokasi gagal dicari.");
    } finally {
      setSearching(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Browser tidak mendukung akses lokasi.");
      return;
    }
    setMessage("Mengambil lokasi Anda...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        chooseLocation({
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6)),
        }),
      () => setMessage("Izin lokasi ditolak atau lokasi tidak dapat ditemukan."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const safeLocation = isValidCoordinates(location) ? location : DEFAULT_LOCATION;
  const hasSelectedLocation = selected && isValidCoordinates(location);

  return (
    <div className="grid gap-3 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Titik lokasi bisnis</p>
          <p className="text-xs text-stone-500">Cari, klik peta, atau geser marker.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
          onClick={useCurrentLocation}
          type="button"
        >
          <LocateFixed size={16} /> Lokasi saya
        </button>
      </div>

      <div className="relative">
        <MapPin
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          size={18}
        />
        <input
          aria-label="Cari alamat atau wilayah"
          className="w-full rounded-xl border bg-white py-3 pl-11 pr-28 text-sm shadow-sm focus:border-blush"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            void search();
          }}
          placeholder="Cari alamat atau nama wilayah"
          value={query}
        />
        <button
          className="absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          disabled={searching}
          onClick={() => void search()}
          type="button"
        >
          <Search size={14} /> {searching ? "Mencari" : "Cari"}
        </button>
      </div>

      {message && <p className="text-xs text-stone-500">{message}</p>}
      {results.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-white shadow-sm">
          {results.map((result) => (
            <li key={`${result.latitude}-${result.longitude}`}>
              <button
                className="w-full px-4 py-3 text-left text-sm hover:bg-rose-50"
                onClick={() => chooseLocation(result)}
                type="button"
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-2xl border bg-stone-50 shadow-sm">
        <LocationMap onChange={chooseLocation} value={safeLocation} />
      </div>
      <p className="text-xs text-stone-500">
        {hasSelectedLocation
          ? `Koordinat tersimpan: ${safeLocation.latitude}, ${safeLocation.longitude}`
          : "Pilih titik lokasi bisnis pada peta."}
      </p>
      <input
        name="latitude"
        type="hidden"
        value={hasSelectedLocation ? safeLocation.latitude : ""}
      />
      <input
        name="longitude"
        type="hidden"
        value={hasSelectedLocation ? safeLocation.longitude : ""}
      />
    </div>
  );
}

function parseCoordinates(
  latitudeValue: number | string,
  longitudeValue: number | string,
): Coordinates | null {
  if (latitudeValue === "" || longitudeValue === "") return null;
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
    ? { latitude, longitude }
    : null;
}
