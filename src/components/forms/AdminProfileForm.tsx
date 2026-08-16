"use client";

import { type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { ErrorState, LoadingSkeleton } from "@/components/states/States";
import { ToastMessage } from "@/components/common/Toast";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/FormFields";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import {
  AccountError,
  getAccountProfile,
  saveAccountProfile,
  type AccountProfile,
} from "@/services/accountService";

export function AdminProfileForm() {
  const profile = useAsyncResource<AccountProfile | null>(getAccountProfile, {
    initialData: null,
    mapError: accountLoadError,
  });
  const save = useAsyncAction();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await save.run(
      () =>
        saveAccountProfile({
          fullname: String(form.get("fullname") ?? "").trim(),
          email: String(form.get("email") ?? "")
            .trim()
            .toLowerCase(),
          phoneNumber: String(form.get("phoneNumber") ?? "").trim() || null,
        }),
      {
        errorMessage: accountSaveError,
        successMessage: "Profile admin berhasil disimpan.",
      },
    );
    if (result.success) profile.setData(result.data);
  }

  if (profile.loading) return <LoadingSkeleton />;
  if (profile.error || !profile.data) return <ErrorState retry={() => void profile.reload()} />;

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
        <AppInput
          defaultValue={profile.data.fullname}
          label="Nama lengkap"
          name="fullname"
          required
        />
        <AppInput
          defaultValue={profile.data.email}
          label="Email"
          name="email"
          type="email"
          required
        />
        <AppInput
          defaultValue={profile.data.phoneNumber ?? ""}
          label="Nomor HP"
          name="phoneNumber"
          type="tel"
        />
        <AppInput disabled label="Status akun" value={profile.data.active ? "Aktif" : "Nonaktif"} />
      </div>
      {save.error ? (
        <ToastMessage message={save.error} variant="error" />
      ) : (
        save.message && <ToastMessage message={save.message} />
      )}
      <div className="flex justify-end">
        <AppButton loading={save.loading} type="submit">
          Simpan perubahan
        </AppButton>
      </div>
    </form>
  );
}

function accountLoadError() {
  return "Profile admin gagal dimuat.";
}

function accountSaveError(error: unknown) {
  return error instanceof AccountError ? error.message : "Profile admin gagal disimpan.";
}
