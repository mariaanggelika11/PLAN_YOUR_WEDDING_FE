# Integrasi frontend — perubahan backend 3 Oktober 2026

## Scope

Frontend mengikuti dokumen “Perubahan Backend untuk Frontend — 10 Poin Feedback” dan kontrak Swagger server `https://api-planyourwedding.bulmar.tech/api-json` yang diperiksa 3 Oktober 2026. Tidak mengubah source/backend lokal, GitHub backend, konfigurasi database, atau menjalankan migration. Tidak memakai endpoint tambahan dari eksperimen backend sebelumnya dan tidak membutuhkan feature flag.

## Perubahan

| Poin | API server | Integrasi frontend |
| --- | --- | --- |
| A1 | GET /vendor-products/:id/availability | Tepat di bawah tanggal checkout. Menonaktifkan submit ketika belum diperiksa, penuh, lewat, atau gagal. Mengecek lagi setelah DATE_FULL/PAST_DATE/PRODUCT_UNAVAILABLE. |
| A1 | maxOrdersPerDay pada produk | Input integer minimal1 pada create/edit paket vendor; dikirim lewat mapper payload existing. |
| A2 | GET /dashboard/summary?role=... | Kartu customer/vendor/admin dan tabel recentOrders. Role response harus sesuai role yang diminta. Customer countdown berdasarkan profil, progres dari tasks server. |
| A3 | GET /budget/summary | Anggaran, committedAmount, verifiedPayments, remainingBudget, outstandingBills, overBudget, tabel pesanan dan kategori. Tidak lagi membaca semua order/detail untuk menghitung budget. |
| A4 | GET/POST /orders/:id/messages, PUT /messages/read | Bagian percakapan di detail pesanan customer/vendor/admin. Bubble isMine, nama pengirim, status baca, teks dan hingga5 gambar, pagination pesan lama, polling20detik ketika tab terlihat dan bagian chat terbuka. canSend mengontrol input, termasuk akses mediasi admin. |
| A5 | GET /vendor-products?marketplace=true | Search, filter kategori/lokasi/harga/kapasitas dan sortBy dijalankan server. Pagination12 item; perubahan filter kembali halaman1. Filter-options mengisi lokasi/sort dan petunjuk harga/kapasitas; kategori tetap master parameter. |
| B1 | actionUrl pada notifications | Komponen notifikasi existing sudah membuka tautan internal sesuai role. Notifikasi lama dengan actionUrl null tetap tanpa tautan; tidak mengarang tujuan. |
| B2 | GET /vendor-profile/:id/store | Halaman toko memakai endpoint publik dan stats server. Produk memakai vendorId + marketplace=true, ulasan tetap vendorId. Tidak meminta profil privat vendor lain. |
| B3 | keepPortfolioAttachmentIds pada PUT vendor profile | Menambah foto dengan mempertahankan ID foto lama. Tidak lagi mengirim ulang kontak saat upload portofolio. Hapus foto memakai attachment existing. |
| B4 | payments[].proofs[] | Riwayat waktu unggah/review, status, alasan penolakan, dan file bukti pada customer/vendor/admin. Bukti terbaru tetap tampil seperti sebelumnya. Detail order memakai paidAmount/outstandingAmount server. |
| B5 | code pada respons error | Helper membaca code dari payload. Konflik ORDER_ALREADY_PROCESSED, PAYMENT_ALREADY_PROCESSED dan INVALID_STATUS_TRANSITION memicu reload detail. DUPLICATE_REVIEW mengarahkan ke detail pesanan; ORDER_CLOSED mengunci chat. |

## Breaking changes

- Marketplace `getStore()` sudah mengganti endpoint profil privat ke `/store`.
- Admin verify/reject sudah memakai `/vendor-profile/:id/verify` dan `/reject` dengan rejectReason; tidak mengirim status/isVerified via PUT profil.
- Tombol transaksi tetap mengikuti role: customer upload/complete/cancel, vendor memproses order dan pembayaran, admin memverifikasi pembayaran serta menyelesaikan sengketa. Chat mempercayai canSend backend.
- POST /orders menggunakan tanggal YYYY-MM-DD. DATE_FULL menonaktifkan submit dan mengecek ketersediaan lagi; DUPLICATE_ORDER menampilkan tautan “Lihat pesanan saya” ke daftar pesanan, karena kontrak error tidak menyediakan ID pesanan existing.
- Rumus sisa anggaran sekarang **totalBudget − committedAmount**, bukan totalBudget − verifiedPayments. UI memakai remainingBudget server langsung dan menjelaskan perbedaan dengan sisa tagihan.
- API client tetap memakai bearer token dan proxy /backend-api menuju server existing.

## Verifikasi

- 48 unit tests frontend lulus, termasuk kode konflik dan penggunaan total pembayaran server.
- TypeScript dan build produksi lulus.
- Chrome dengan fixture sesuai kontrak Swagger: dashboard tiga role; filter query/marketplace=true; toko publik tanpa GET profil privat; budget; tanggal tersedia/penuh/lewat; respons DATE_FULL dan DUPLICATE_ORDER saat checkout; chat baca/kirim/read-only, pagination, gambar multipart; histori bukti; konflik verifikasi payment memuat ulang; portofolio mempertahankan ID foto dan tidak mengirim kontak.
- Pemeriksaan mobile390px pada rute yang diuji tidak menemukan overflow root atau error JavaScript.
- Fixture memverifikasi perilaku frontend, bukan keberhasilan transaksi/ownership di database server. Tidak melakukan transaksi produksi.

## Dependensi operasional

Catatan backend menyebut migration max_orders_per_day, order_messages dan order_payment_proofs masih perlu dijalankan tim backend. Swagger sudah mendaftarkan endpoint; hal itu tidak membuktikan migration server selesai. Jika endpoint gagal karena migration belum siap, frontend menampilkan error/retry dan tidak menggunakan data dummy. Pengujian end-to-end dengan akun nyata perlu dilakukan sesudah tim backend memastikan migration dan menyediakan akun uji.
