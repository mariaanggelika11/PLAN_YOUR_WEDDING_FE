"use client";

import type { AssistantContext } from "@/features/assistant/types";
import { AppButton } from "@/shared/components/ui/AppButton";
import type { AppRole } from "@/shared/config/routes";
import * as Dialog from "@radix-ui/react-dialog";
import { Bot, MessageCircleQuestion, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export function OrderAssistant({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const [question, setQuestion] = useState("");
  const context = useMemo(() => assistantContext(pathname, role), [pathname, role]);
  if (!context) return null;
  const suggestions = assistantSuggestions(context);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          aria-label="Buka asisten alur pesanan"
          className="fixed bottom-24 right-4 z-40 flex min-h-12 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800 sm:right-6 lg:bottom-6"
          type="button"
        >
          <Sparkles size={17} />
          <span className="hidden sm:inline">Tanya PYW AI</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/35 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-md flex-col bg-[#faf8f5] shadow-2xl outline-none">
          <header className="flex items-start gap-3 border-b bg-white p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-blush">
              <Bot size={22} />
            </span>
            <div className="min-w-0">
              <Dialog.Title className="font-semibold text-ink">PYW Order Assistant</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs leading-5 text-stone-500">
                Pelajari status, pembayaran, dan langkah berikutnya dalam pesanan.
              </Dialog.Description>
            </div>
            <Dialog.Close className="ml-auto grid size-9 shrink-0 place-items-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-ink" aria-label="Tutup asisten">
              <X size={18} />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <div className="flex items-center gap-2 font-semibold"><Sparkles size={16} /> UI preview</div>
              <p className="mt-1.5 text-xs leading-5 text-blue-700">
                Layanan AI backend belum terhubung. Pertanyaan belum dikirim dan tidak ada data pesanan yang diproses AI.
              </p>
            </div>

            <div className="mt-5 rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600"><MessageCircleQuestion size={18} /></span>
                <div>
                  <p className="text-sm font-semibold text-ink">Apa yang ingin Anda pahami?</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    Saya nantinya menggunakan halaman aktif sebagai konteks, tanpa meminta Anda menyalin nomor order.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    className="rounded-full border bg-white px-3 py-2 text-left text-xs font-medium text-stone-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-blush"
                    key={suggestion}
                    onClick={() => setQuestion(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-stone-100 p-3 text-xs leading-5 text-stone-600">
              <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={16} />
              <p>Asisten hanya memberi penjelasan. Verifikasi pembayaran, penolakan, dan perubahan status tetap membutuhkan tindakan pengguna.</p>
            </div>
          </div>

          <footer className="border-t bg-white p-4">
            <label className="sr-only" htmlFor="pyw-ai-question">Pertanyaan untuk asisten</label>
            <textarea
              className="min-h-24 w-full resize-none rounded-2xl border bg-stone-50 px-4 py-3 text-sm outline-none focus:border-blush focus:ring-4 focus:ring-rose-100"
              id="pyw-ai-question"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Contoh: Setelah pembayaran diverifikasi, apa langkah berikutnya?"
              value={question}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-stone-400">AI dapat keliru. Status resmi selalu berasal dari sistem.</p>
              <AppButton disabled title="Menunggu integrasi backend">
                <Send size={15} /> Kirim
              </AppButton>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function assistantContext(pathname: string, role: AppRole): AssistantContext | null {
  if (role === "admin") return null;
  const match = pathname.match(/^\/(customer|vendor)\/orders\/([^/]+)/);
  return { pathname, role, orderId: match?.[2] };
}

function assistantSuggestions(context: AssistantContext) {
  if (context.role === "vendor") {
    return context.orderId
      ? ["Apa yang harus saya periksa sebelum verifikasi pembayaran?", "Kapan saya bisa menerima pesanan?", "Apa beda menolak bukti dan menolak pesanan?"]
      : ["Bagaimana alur pesanan vendor?", "Kapan pembayaran perlu diverifikasi?", "Mengapa pesanan belum bisa diterima?"];
  }
  return context.orderId
    ? ["Apa arti status pesanan saya?", "Apa langkah setelah upload bukti?", "Bagaimana jika bukti pembayaran ditolak?"]
    : ["Bagaimana cara membuat pesanan?", "Apa beda bayar DP dan lunas?", "Bagaimana alur verifikasi pembayaran?"];
}
