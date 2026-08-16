"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export interface PaginationQuery {
  filter?: string;
  pageNumber?: number;
  pageSize?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export function usePaginatedResource<T>(
  loader: (query: PaginationQuery) => Promise<PaginatedResult<T>>,
  { pageSize = 10, mapError = defaultErrorMessage } = {},
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const debouncedSearch = useDebounce(search);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await loader({
        filter: debouncedSearch || undefined,
        pageNumber: page,
        pageSize,
      });
      if (currentRequest === requestId.current) {
        setData(result.data);
        setTotal(result.total);
      }
    } catch (loadError) {
      if (currentRequest === requestId.current) setError(mapError(loadError));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [debouncedSearch, loader, mapError, page, pageSize]);

  useEffect(() => {
    void reload();
    return () => {
      requestId.current += 1;
    };
  }, [reload]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return { changeSearch, data, error, loading, page, reload, search, setData, setPage, total };
}

function defaultErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Data gagal dimuat.";
}
