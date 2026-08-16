"use client";

import { getActiveParameterDetailsByCodes } from "@/features/parameters/api";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface MasterParameterOption {
  label: string;
  value: string;
}

const optionCache = new Map<string, MasterParameterOption[]>();

export function useMasterParameters(codes: readonly string[]) {
  const cacheKey = codes.map(normalizeParameterCode).join("|");
  const normalizedCodes = useMemo(() => (cacheKey ? cacheKey.split("|") : []), [cacheKey]);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [optionsByCode, setOptionsByCode] = useState(() => optionsFromCache(normalizedCodes));
  const [loading, setLoading] = useState(() =>
    normalizedCodes.some((code) => !optionCache.has(code)),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const clearForNewSession = () => {
      optionCache.clear();
      setOptionsByCode({});
      setError("");
      setLoading(true);
      setCacheVersion((current) => current + 1);
    };
    window.addEventListener("pyw-auth-change", clearForNewSession);
    return () => window.removeEventListener("pyw-auth-change", clearForNewSession);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const requestedCodes = normalizedCodes.filter((code) => !optionCache.has(code));

    if (requestedCodes.length === 0) {
      setOptionsByCode(optionsFromCache(normalizedCodes));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    getActiveParameterDetailsByCodes(requestedCodes)
      .then((parameters) => {
        requestedCodes.forEach((code) => {
          const normalizedCode = normalizeParameterCode(code);
          const details = parameters.get(normalizedCode) ?? [];
          optionCache.set(
            normalizedCode,
            details.map((detail) => ({
              label: detail.description?.trim() || detail.code,
              value: detail.code,
            })),
          );
        });
        if (!cancelled) setOptionsByCode(optionsFromCache(normalizedCodes));
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Master parameter gagal dimuat.",
          );
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [cacheKey, cacheVersion, normalizedCodes]);

  const getOptions = useCallback(
    (code: string) => optionsByCode[normalizeParameterCode(code)] ?? [],
    [optionsByCode],
  );

  const resolveValue = useCallback(
    (code: string, savedValue: string | null | undefined) =>
      resolveSavedValue(savedValue, getOptions(code)),
    [getOptions],
  );

  const resolveValues = useCallback(
    (code: string, savedValues: string[] | null | undefined) =>
      (savedValues ?? []).flatMap((savedValue) => {
        const value = resolveSavedValue(savedValue, getOptions(code));
        return value ? [value] : [];
      }),
    [getOptions],
  );

  const emptyMessage = useCallback(
    (code: string) => error || `Belum ada detail aktif pada parameter ${code}.`,
    [error],
  );

  return { emptyMessage, error, getOptions, loading, resolveValue, resolveValues };
}

function optionsFromCache(codes: string[]) {
  return Object.fromEntries(codes.map((code) => [code, optionCache.get(code) ?? []]));
}

function resolveSavedValue(
  savedValue: string | null | undefined,
  options: MasterParameterOption[],
) {
  if (!savedValue) return "";
  const normalizedSavedValue = normalizeParameterCode(savedValue);
  return (
    options.find(
      (option) =>
        normalizeParameterCode(option.value) === normalizedSavedValue ||
        normalizeParameterCode(option.label) === normalizedSavedValue,
    )?.value ?? ""
  );
}

function normalizeParameterCode(value: string) {
  return value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").toUpperCase();
}
