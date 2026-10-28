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
  const { pageNumber: _pageNumber, pageSize: _pageSize, ...filters } = query;
  const filterKey = JSON.stringify(filters);
  const globalTasks = useAsyncResource(planningService.getAllTasks, { initialData: null });
  const hasFilters = Object.entries(filters).some(([key, value]) =>
    key === "sortBy" ? value !== "due_asc" : value !== undefined && value !== "",
  );
  const taskLoader = useCallback(
    () => planningService.getAllTasks(JSON.parse(filterKey) as WeddingTaskQuery),
    [filterKey],
  );
  const filteredTasks = useAsyncResource(taskLoader, { initialData: null, autoLoad: hasFilters });
  const taskCollection = hasFilters ? filteredTasks : globalTasks;
  const tasks = taskCollection;
  const previousSearch = useRef(debouncedSearch);
  useEffect(() => {
    if (previousSearch.current === debouncedSearch) return;
    previousSearch.current = debouncedSearch;
    setQuery((current) => ({ ...current, filter: debouncedSearch, pageNumber: 1 }));
  }, [debouncedSearch]);

  function changeFilters(next: Partial<WeddingTaskQuery>) {
    setQuery((current) => ({ ...current, ...next, pageNumber: 1 }));
  }
  function resetFilters() {
    setSearch("");
    previousSearch.current = "";
    setQuery((current) => ({ pageNumber: 1, pageSize: current.pageSize, sortBy: current.sortBy }));
  }
  async function refresh() {
    await Promise.allSettled([
      summary.reload(),
      globalTasks.reload(),
      ...(hasFilters ? [filteredTasks.reload()] : []),
    ]);
  }

  return {
    plan,
    summary,
    tasks,
    allTasks: taskCollection.data ?? [],
    globalTasks,
    query,
    search,
    setSearch,
    changeFilters,
    resetFilters,
    refresh,
  };
}
