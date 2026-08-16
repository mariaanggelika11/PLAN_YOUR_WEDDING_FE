"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { ErrorState, LoadingSkeleton } from "@/components/states/States";
import { ToastMessage } from "@/components/common/Toast";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import {
  AccountError,
  getAccountProfile,
  saveAccountProfile,
  type AccountProfile,
} from "@/services/accountService";

export function AdminProfileForm() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setIsLoading(true);
    setLoadError(false);
    try {
      setProfile(await getAccountProfile());
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await saveAccountProfile({
        fullname: String(form.get("fullname") ?? "").trim(),
        email: String(form.get("email") ?? "")
          .trim()
          .toLowerCase(),
        phoneNumber: String(form.get("phoneNumber") ?? "").trim() || null,
      });
      setProfile(saved);
      setMessage("Profile admin berhasil disimpan.");
    } catch (submitError) {
      setError(
        submitError instanceof AccountError ? submitError.message : "Profile admin gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingSkeleton />;
  if (loadError || !profile) return <ErrorState retry={() => void load()} />;

  return (
    <form className="grid gap-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-7" onSubmit={submit}>
      <section className="flex items-center gap-4 rounded-2xl bg-stone-50 p-5">
        <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-blush">
          <ShieldCheck />
        </span>
        <div>
          <h2 className="font-semibold">Administrator</h2>
          <p className="mt-1 text-sm text-stone-500">
            Kelola informasi dasar akun administrator yang sedang login.
          </p>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <AppInput defaultValue={profile.fullname} label="Nama lengkap" name="fullname" required />
        <AppInput defaultValue={profile.email} label="Email" name="email" type="email" required />
        <AppInput
          defaultValue={profile.phoneNumber ?? ""}
          label="Nomor HP"
          name="phoneNumber"
          type="tel"
        />
        <AppInput disabled label="Status akun" value={profile.active ? "Aktif" : "Nonaktif"} />
      </div>
      {error ? (
        <ToastMessage message={error} variant="error" />
      ) : (
        message && <ToastMessage message={message} />
      )}
      <div className="flex justify-end">
        <AppButton loading={isSaving} type="submit">
          Simpan perubahan
        </AppButton>
      </div>
    </form>
  );
}
