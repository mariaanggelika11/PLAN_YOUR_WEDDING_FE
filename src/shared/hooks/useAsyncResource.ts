"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncResourceOptions<T> {
  autoLoad?: boolean;
  initialData: T;
  mapError?: (error: unknown) => string;
}

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  { autoLoad = true, initialData, mapError = defaultErrorMessage }: AsyncResourceOptions<T>,
) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await loader();
      if (currentRequest === requestId.current) setData(result);
      return result;
    } catch (loadError) {
      if (currentRequest === requestId.current) setError(mapError(loadError));
      return undefined;
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [loader, mapError]);

  useEffect(() => {
    if (autoLoad) void reload();
    return () => {
      requestId.current += 1;
    };
  }, [autoLoad, reload]);

  return { data, error, loading, reload, setData };
}

function defaultErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Data gagal dimuat.";
}
