# Integrasi Wedding Progress

Kontrak diperiksa pada 13 September 2026 melalui https://api-planyourwedding.bulmar.tech/api-json (Swagger: https://api-planyourwedding.bulmar.tech/api#/).

## Sumber data dan alur

- `GET /wedding-plans` mengambil preferensi akun; backend otomatis membuat baris default. Keberadaan baris ini bukan tanda checklist sudah dibuat. Jumlah tugas menentukan tampilan awal.
- `PUT /wedding-plans` menyimpan `traditional`, `outdoor`, `useWo`, dan `autoReschedule`.
- Tanggal, jenis acara, lokasi, tamu, dan anggaran berasal dari customer profile yang sudah dimuat melalui ProfileProvider. Form pengaturan menyediakan tautan ke profil, bukan menyimpan salinan field tersebut di wedding-plans. Pergeseran tenggat saat profil berubah menjadi tanggung jawab backend sesuai deskripsi `autoReschedule`.
- `GET /wedding-tasks` menggunakan `filter` untuk pencarian judul/PIC/catatan, `category`, `status` atau `overdue=true`, `sortBy=due_asc|due_desc`, `pageNumber`, dan `pageSize`. Pencarian memakai debounce. Filter dan urutan baru kembali ke halaman pertama. Backend tetap menentukan hasil filter dan urutan, termasuk penempatan tugas tanpa tenggat. Frontend membaca seluruh halaman hasil filter (meminta 100 item per request, mengikuti batas aktual server), untuk kalender tunggal. Koleksi tanpa filter dipakai ulang saat filter tidak aktif dan selalu menjadi sumber pengingat terlambat. Filter aktif menggunakan request tersendiri dengan kontrak yang sama, sehingga pengingat tidak terpengaruh filter kalender. Respons parsial/gagal tidak ditampilkan sebagai kalender lengkap.
- `GET /wedding-tasks/:id` memuat detail sebelum pengguna mengedit.
- `POST /wedding-tasks` menambahkan tugas. `PUT /wedding-tasks/:id` memperbarui tugas. Subtasks dikirim sebagai daftar pengganti, sesuai kontrak. Centang cepat mengirim status dan subtasks agar perilaku centang induk tetap konsisten.
- Autentikasi dan pembungkus `{ statusCode, message, data }` menggunakan authenticatedDataRequest yang sudah ada. UI tidak mengirim customer/user ID; backend menggunakan akun yang login.

## Struktur kode

- `types.ts`: DTO, query, hasil pagination, dan ringkasan.
- `adapters.ts`: pemetaan `dueDate`/`daysBeforeEvent`/`externalVendor` ke model UI, normalisasi ID, serta payload whitelist. Pesanan dikirim sebagai integer atau null untuk melepas tautan. Tanggal kosong dikirim null, bukan string tanggal kosong; perilaku clearing ini masih perlu diuji pada backend dengan akun login karena Swagger tidak menandai dueDate nullable secara eksplisit.
- `repository.ts`: endpoint dan metode HTTP.
- `service.ts`: ringkasan, pengambilan semua halaman untuk kalender, pengingat lintas bulan, dan ekspor, dan rekonsiliasi template.
- `useWeddingProgress.ts`: state query dan request; useAsyncResource mencegah respons lama menimpa hasil request baru.
- `usePlanningMutation.ts`: proteksi submit ganda dan error penyimpanan.
- `components/`: form pengaturan, editor tugas, dan modal. Form mempertahankan input saat gagal dan mencegah penutupan modal selama penyimpanan.

Local storage bukan lagi sumber data checklist. Salinan lama tidak dihapus dan tidak otomatis dikirim ke server. Ekspor PDF mengambil seluruh halaman dari backend, bukan hanya hasil filter/halaman yang tampil. Modul PDF dan font Noto Sans dimuat saat pengguna mengunduh; PDF dibuat di browser dengan ringkasan acara, progres, tugas, subtugas, dan catatan.

## Keterbatasan kontrak saat ini

1. Belum ada endpoint summary. Service menghitung progres dari enam request list berukuran satu baris: seluruh tugas, completed, skipped, overdue, important TODO, important IN_PROGRESS. Total diambil dari metadata API, bukan panjang array. Skipped dikeluarkan dari penyebut progres. Filter daftar tidak memengaruhi ringkasan. Salah satu request gagal menyebabkan error ringkasan, bukan angka nol palsu.
2. Belum ada endpoint bulk/template. Saat pengguna menyimpan pengaturan atau membuat checklist, frontend membaca tugas yang sudah ada dan mengirim POST untuk template yang belum ada. Proses berurutan mempertahankan hasil yang sudah tersimpan jika request berikutnya gagal. Retry membaca ulang server sebelum melanjutkan. Matching menggunakan kategori/judul atau panduan/offset template sehingga perubahan judul tidak langsung menghasilkan duplikasi. Ini bukan pengganti jaminan idempotensi lintas tab/perangkat.
3. DELETE /wedding-tasks/:id digunakan dari detail tugas dengan konfirmasi. Backend tetap memeriksa kepemilikan dan menghapus subtugas secara cascade. Tugas template yang dihapus dapat dibuat kembali saat template diterapkan ulang; tanpa tombstone/templateId existing, frontend tidak mengubah perilaku rekonsiliasi ini.

Untuk pengembangan backend berikutnya, endpoint summary dan operasi template atomik dengan templateId unik per customer akan mengurangi jumlah request dan menjamin tidak ada duplikasi ketika dua perangkat membuat checklist bersamaan.

## Validasi

Unit test memeriksa pemetaan DTO, clearing payload, query, ringkasan global, kegagalan request, pengambilan semua halaman saat page size dibatasi server, dan retry template setelah kegagalan parsial. Build production juga dijalankan. Pengujian tulis terhadap backend live memerlukan sesi customer; implementasi ini tidak membuat akun atau mengubah data live selama pengembangan.

## Redesign frontend — 29 Oktober 2026

### Audit dan logic yang dipertahankan

- ProgressPage mengorkestrasi profil customer, preferensi rencana, ringkasan, koleksi tugas, editor detail, tambah tugas, pengaturan template, dan ekspor PDF. Hak akses tetap mengikuti middleware/authenticatedDataRequest dan backend; tidak ada perubahan role atau cakupan akun.
- Status asli adalah TODO, IN_PROGRESS, COMPLETED, SKIPPED. isPending hanya mencakup TODO/IN_PROGRESS. Rumus ringkasan tetap menggunakan metadata enam request existing dan mengecualikan SKIPPED dari penyebut. Model, DTO, adapter, validasi editor, dan payload create/update tidak diubah. Repository hanya ditambah wrapper DELETE untuk endpoint existing tanpa mengubah kontraknya.
- Quick complete tetap menjalankan setTaskStatus dan PUT status/subtasks. Editor tetap memuat GET detail, menyimpan melalui PUT, dan menambah melalui POST. Mutasi memakai lock/error handler existing dan refresh ringkasan serta koleksi tugas setelah berhasil.
- Tanggal acara berasal dari customer profile. Perubahan template/autoReschedule tetap menjadi alur existing; UI tidak memindahkan deadline. Menambah dari tanggal terpilih mengisi tanggal yang secara eksplisit dipilih pengguna. Menambah dari header tetap mengizinkan tanpa tanggal.
- Subtugas, catatan, PIC, kategori, status, prioritas, vendor eksternal, pesanan terkait, preferensi rencana, dan ekspor PDF tetap tersedia. Endpoint DELETE existing kini dihubungkan ke tombol Hapus tugas di editor atas permintaan pengguna. Tombol tidak tersedia pada draft baru. Konfirmasi menjelaskan penghapusan subtugas, pesanan yang tetap tersimpan, dan kemungkinan template dibuat kembali saat diterapkan ulang.

### Kalender tunggal

- Navigasi utama menampilkan 12 bulan dalam satu ringkasan tahun, dengan jumlah tugas dan indikator status per bulan. Tombol sebelumnya/berikutnya menggeser tahun; memilih bulan membuka kalender tanggalnya. Navigasi tahun/bulan tidak memanggil API atau mengubah data.
- Tidak ada tab daftar tugas, checklist terpisah, atau timeline. Kalender menampilkan seluruh tugas bertanggal sesuai filter. Panel di bawah kalender memuat tugas tanggal terpilih dan memakai PlanningTaskRow bersama pengingat terlambat serta panel tugas tanpa tenggat.
- Merah = pending dengan deadline sebelum hari ini; pink = pending dengan deadline hari ini/setelahnya; hijau = COMPLETED; abu-abu = SKIPPED. Legenda teks dan label screen reader menyampaikan arti warna, termasuk status campuran pada tanggal yang sama. Hari ini memakai outline netral tersendiri.
- OverdueReminder membaca seluruh koleksi akun tanpa filter dan tidak bergantung pada bulan kalender aktif. Banner mengelompokkan jumlah tugas per bulan/tahun, dapat dibuka, dan memakai deadline asli. Derivasi overdue tidak menulis data/status. Tenggat hari ini belum dianggap terlambat; tanggal mengikuti todayDate/dateOffset existing.
- Tugas tanpa tenggat tetap tersedia dalam disclosure “Belum dijadwalkan”. Membuka/edit tugas menggunakan modal existing; tidak ada deadline otomatis.
- Ringkasan global tetap tidak mengikuti filter. Jumlah tugas akan datang di toolbar mengikuti filter aktif. Navigasi bulan/tahun dan membuka panel tidak memanggil API atau menulis data.
- Global tasks diambil sekali melalui seluruh halaman existing, dipakai ulang saat tanpa filter. Filter aktif memuat koleksi terpisah agar banner global tetap lengkap. Refresh/mutasi memuat ulang ringkasan dan koleksi yang relevan. Ini menambah request pada akun dengan banyak tugas, tanpa endpoint/database baru.

### Validasi dan keterbatasan

- Unit tests mencakup status/progres existing, DTO/payload, template, kalender lintas tahun/kabisat, overdue lintas bulan, pengecualian completed/skipped/tanpa tanggal, tenggat hari ini, serta fetch seluruh halaman dengan filter dan batas ukuran halaman server.
- Regression browser menggunakan API terisolasi; tidak membuat akun atau mengubah data produksi. Pemeriksaan mencakup navigasi, selected day, create/edit/status, delete (batal/berhasil/403/500/offline, respons 204, proteksi klik ganda, refresh ringkasan/kalender/banner), penjadwalan tugas tanpa tanggal, filter, pengingat lintas bulan/tahun, refresh/reload, loading/error/retry, empty wedding, dan viewport mobile/desktop.
- Penghapusan menggunakan authenticatedRequest karena endpoint mengembalikan HTTP 204 tanpa body. Lock mutasi existing mencegah submit ganda/penutupan modal selama konfirmasi dan penghapusan. Setelah berhasil, kalender, banner overdue, dan ringkasan dimuat ulang; jika gagal, editor dan draft tetap terbuka untuk retry. Penghapusan tidak memengaruhi pesanan terkait.
- Script lint proyek masih memicu wizard konfigurasi ESLint karena konfigurasi existing belum tersedia. Jangan menganggap pemeriksaan lint sudah lulus; typecheck, build, dan format check dijalankan terpisah.
