"use client";

import { AppIconButton } from "@/shared/components/ui/AppIconButton";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface SelectedImage {
  file: File;
  id: string;
  previewUrl: string;
}

interface ExistingImage {
  id: string;
  previewUrl: string;
}

export function MultiImageUpload({
  helper,
  existingImageIds = [],
  label,
  loadExistingImage,
  maxFiles = 10,
  name,
  required,
}: {
  helper?: string;
  existingImageIds?: string[];
  label: string;
  loadExistingImage?: (id: string) => Promise<Blob>;
  maxFiles?: number;
  name: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SelectedImage[]>([]);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState("");
  const existingImageKey = existingImageIds.join("|");

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    if (!loadExistingImage || existingImageIds.length === 0) {
      setExistingImages([]);
      setLoadingExisting(false);
      return;
    }
    setLoadingExisting(true);
    setRemovedExistingIds([]);
    setExistingImages([]);
    Promise.allSettled(
      existingImageIds.map(async (id) => {
        const previewUrl = URL.createObjectURL(await loadExistingImage(id));
        objectUrls.push(previewUrl);
        if (!cancelled) {
          setExistingImages((current) => {
            if (current.some((image) => image.id === id)) return current;
            return [...current, { id, previewUrl }].sort(
              (left, right) =>
                existingImageIds.indexOf(left.id) - existingImageIds.indexOf(right.id),
            );
          });
        }
        return { id, previewUrl };
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const loaded = results.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        if (loaded.length !== existingImageIds.length) {
          setError("Sebagian foto tersimpan tidak dapat dimuat.");
        }
      })
      .finally(() => !cancelled && setLoadingExisting(false));
    return () => {
      cancelled = true;
      objectUrls.forEach(URL.revokeObjectURL);
    };
    // IDs menjadi kunci stabil agar gambar tidak dimuat ulang pada setiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingImageKey, loadExistingImage]);

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const invalidType = selected.find((file) => !IMAGE_TYPES.has(file.type));
    const oversized = selected.find((file) => file.size > MAX_IMAGE_SIZE);
    if (invalidType) {
      setError(`${invalidType.name}: format harus JPG, PNG, atau WebP.`);
      syncInput(images);
      return;
    }
    if (oversized) {
      setError(`${oversized.name}: ukuran maksimal 5 MB.`);
      syncInput(images);
      return;
    }

    const existingKeys = new Set(images.map(({ file }) => fileKey(file)));
    const additions = selected
      .filter((file) => !existingKeys.has(fileKey(file)))
      .map((file) => ({ file, id: fileKey(file), previewUrl: URL.createObjectURL(file) }));
    const availableSlots = Math.max(0, maxFiles - existingImages.length);
    const next = [...images, ...additions].slice(0, availableSlots);
    additions
      .slice(Math.max(0, availableSlots - images.length))
      .forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages(next);
    syncInput(next);
    setError(
      images.length + additions.length > availableSlots
        ? `Maksimal ${maxFiles} foto dalam satu produk.`
        : "",
    );
  }

  function removeImage(id: string) {
    const removed = images.find((image) => image.id === id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    const next = images.filter((image) => image.id !== id);
    setImages(next);
    syncInput(next);
    setError("");
  }

  function removeExistingImage(id: string) {
    setExistingImages((current) => current.filter((image) => image.id !== id));
    setRemovedExistingIds((current) => [...new Set([...current, id])]);
    setError("");
  }

  function syncInput(next: SelectedImage[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    next.forEach(({ file }) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </legend>
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-stone-50 px-5 py-6 text-center transition hover:border-rose-300 hover:bg-rose-50">
        <ImagePlus className="mb-2 text-blush" size={28} />
        <span className="text-sm font-semibold">
          {images.length || existingImages.length ? "Tambah foto lainnya" : "Pilih beberapa foto"}
        </span>
        <span className="mt-1 text-xs text-stone-500">
          {existingImages.length + images.length}/{maxFiles} foto
        </span>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          multiple
          name={name}
          onChange={selectImages}
          ref={inputRef}
          required={required && existingImages.length + images.length === 0}
          type="file"
        />
      </label>
      {loadingExisting && (
        <p className="flex items-center gap-2 text-xs text-stone-500">
          <LoaderCircle className="animate-spin" size={14} /> Memuat foto tersimpan...
        </p>
      )}
      {existingImages.length + images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {existingImages.map((image, index) => (
            <div
              className="group relative aspect-square overflow-hidden rounded-2xl border bg-stone-100"
              key={image.id}
            >
              <img
                alt={`Foto tersimpan ${index + 1}`}
                className="size-full object-cover"
                src={image.previewUrl}
              />
              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-stone-600 shadow-sm">
                Tersimpan
              </span>
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-semibold text-white">
                  Foto utama
                </span>
              )}
              <AppIconButton
                className="absolute bottom-2 right-2 size-9 rounded-full bg-white/95 shadow-md"
                label={`Hapus foto tersimpan ${index + 1}`}
                onClick={() => removeExistingImage(image.id)}
                title="Hapus saat perubahan disimpan"
                type="button"
                variant="danger"
              >
                <Trash2 size={16} />
              </AppIconButton>
            </div>
          ))}
          {images.map((image, index) => (
            <div
              className="group relative aspect-square overflow-hidden rounded-2xl border bg-stone-100"
              key={image.id}
            >
              <img
                alt={`Preview foto ${index + 1}`}
                className="size-full object-cover"
                src={image.previewUrl}
              />
              {existingImages.length === 0 && index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-semibold text-white">
                  Foto utama
                </span>
              )}
              <AppIconButton
                className="absolute bottom-2 right-2 size-9 rounded-full bg-white/95 shadow-md"
                label={`Hapus foto ${index + 1}`}
                onClick={() => removeImage(image.id)}
                type="button"
                variant="danger"
              >
                <Trash2 size={16} />
              </AppIconButton>
            </div>
          ))}
        </div>
      )}
      {removedExistingIds.map((id) => (
        <input key={id} name="removedImageIds" readOnly type="hidden" value={id} />
      ))}
      <p className={`text-xs ${error ? "text-red-600" : "text-stone-500"}`}>
        {error ||
          helper ||
          `JPG, PNG, atau WebP maksimal 5 MB per foto. Maksimal ${maxFiles} foto.`}
      </p>
    </fieldset>
  );
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
