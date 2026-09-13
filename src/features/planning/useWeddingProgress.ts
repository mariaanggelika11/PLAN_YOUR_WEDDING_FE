"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { useDebounce } from "@/shared/hooks/useDebounce";
import * as repository from "./repository";
import { createPlanningService } from "./service";
import type { WeddingTaskQuery } from "./types";

export const planningService = createPlanningService(repository);

export function useWeddingProgress() {
  const [query, setQuery] = useState<WeddingTaskQuery>({
    pageNumber: 1,
    pageSize: 10,
    sortBy: "due_asc",
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const plan = useAsyncResource(repository.getWeddingPlan, { initialData: null });
  const summary = useAsyncResource(planningService.getSummary, { initialData: null });
  const taskLoader = useCallback(() => repository.getWeddingTasks(query), [query]);
  const tasks = useAsyncResource(taskLoader, { initialData: null });
  const previousSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (previousSearch.current === debouncedSearch) return;
    previousSearch.current = debouncedSearch;
    setQuery((current) => ({ ...current, filter: debouncedSearch, pageNumber: 1 }));
  }, [debouncedSearch]);
  useEffect(() => {
    if (!tasks.data || tasks.loading || tasks.error) return;
    const lastPage = Math.max(1, Math.ceil(tasks.data.total / (query.pageSize ?? 10)));
    if ((query.pageNumber ?? 1) > lastPage) {
      setQuery((current) => ({ ...current, pageNumber: lastPage }));
    }
  }, [tasks.data, tasks.loading, tasks.error, query.pageNumber, query.pageSize]);

  function changeFilters(next: Partial<WeddingTaskQuery>) {
    setQuery((current) => ({ ...current, ...next, pageNumber: 1 }));
  }
  function resetFilters() {
    setSearch("");
    previousSearch.current = "";
    setQuery((current) => ({ pageNumber: 1, pageSize: current.pageSize, sortBy: current.sortBy }));
  }
  async function refresh() {
    await Promise.allSettled([summary.reload(), tasks.reload()]);
  }

  return {
    plan,
    summary,
    tasks,
    query,
    search,
    setSearch,
    changeFilters,
    resetFilters,
    setPage: (pageNumber: number) => setQuery((current) => ({ ...current, pageNumber })),
    refresh,
  };
}
