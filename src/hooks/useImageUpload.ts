"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

export function useImageUpload({
  enabled = true,
  load,
  loadErrorMessage,
}: {
  enabled?: boolean;
  load?: () => Promise<Blob | null>;
  loadErrorMessage: string;
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(enabled && Boolean(load));
  const [error, setError] = useState("");
  const selectedUrl = useRef("");
  const hasSelection = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let loadedUrl = "";
    hasSelection.current = false;
    if (!enabled || !load) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    load()
      .then((blob) => {
        if (!blob || cancelled) return;
        loadedUrl = URL.createObjectURL(blob);
        if (!hasSelection.current) setPreviewUrl(loadedUrl);
      })
      .catch(() => !cancelled && setError(loadErrorMessage))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      if (loadedUrl) URL.revokeObjectURL(loadedUrl);
    };
  }, [enabled, load, loadErrorMessage]);

  useEffect(
    () => () => {
      if (selectedUrl.current) URL.revokeObjectURL(selectedUrl.current);
    },
    [],
  );

  const selectImage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (selectedUrl.current) URL.revokeObjectURL(selectedUrl.current);
    selectedUrl.current = URL.createObjectURL(file);
    hasSelection.current = true;
    setPreviewUrl(selectedUrl.current);
    setError("");
  }, []);

  return {
    clearPreview: useCallback(() => setPreviewUrl(""), []),
    error,
    loading,
    previewUrl,
    selectImage,
    setError,
    setLoading,
  };
}
