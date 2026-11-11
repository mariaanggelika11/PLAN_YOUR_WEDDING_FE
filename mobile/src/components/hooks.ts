import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

export function useResource<T>(loader: () => Promise<T>, dependencies: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const currentLoader = useRef(loader);
  currentLoader.current = loader;
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const id = ++generation.current;
    setLoading(true);
    setError(null);
    try {
      const result = await currentLoader.current();
      if (id === generation.current) setData(result);
    } catch (failure) {
      if (id === generation.current) setError(failure);
    } finally {
      if (id === generation.current) setLoading(false);
    }
  }, dependencies);
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        generation.current++;
      };
    }, [reload]),
  );
  return { data, loading, error, reload };
}
export function useAction() {
  const locked = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = async <T>(action: () => Promise<T>, after?: (data: T) => void | Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (mounted.current) await after?.(result);
    } catch (failure) {
      if (mounted.current) setError(failure);
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return { busy, error, run, clear: () => setError(null) };
}
