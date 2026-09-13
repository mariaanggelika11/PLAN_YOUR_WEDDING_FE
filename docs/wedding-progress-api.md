# Integrasi Wedding Progress

Kontrak diperiksa pada 13 September 2026 melalui https://api-planyourwedding.bulmar.tech/api-json (Swagger: https://api-planyourwedding.bulmar.tech/api#/).

## Sumber data dan alur

- `GET /wedding-plans` mengambil preferensi akun; backend otomatis membuat baris default. Keberadaan baris ini bukan tanda checklist sudah dibuat. Jumlah tugas menentukan tampilan awal.
- `PUT /wedding-plans` menyimpan `traditional`, `outdoor`, `useWo`, dan `autoReschedule`.
- Tanggal, jenis acara, lokasi, tamu, dan anggaran berasal dari customer profile yang sudah dimuat melalui ProfileProvider. Form pengaturan menyediakan tautan ke profil, bukan menyimpan salinan field tersebut di wedding-plans. Pergeseran tenggat saat profil berubah menjadi tanggung jawab backend sesuai deskripsi `autoReschedule`.
- `GET /wedding-tasks` menggunakan `filter` untuk pencarian judul/PIC/catatan, `category`, `status` atau `overdue=true`, `sortBy=due_asc|due_desc`, `pageNumber`, dan `pageSize=10`. Pencarian memakai debounce. Filter dan urutan baru kembali ke halaman pertama. Sorting dan pagination sepenuhnya dilakukan backend, termasuk penempatan tugas tanpa tenggat.
- `GET /wedding-tasks/:id` memuat detail sebelum pengguna mengedit.
- `POST /wedding-tasks` menambahkan tugas. `PUT /wedding-tasks/:id` memperbarui tugas. Subtasks dikirim sebagai daftar pengganti, sesuai kontrak. Centang cepat mengirim status dan subtasks agar perilaku centang induk tetap konsisten.
- Autentikasi dan pembungkus `{ statusCode, message, data }` menggunakan authenticatedDataRequest yang sudah ada. UI tidak mengirim customer/user ID; backend menggunakan akun yang login.

## Struktur kode

- `types.ts`: DTO, query, hasil pagination, dan ringkasan.
- `adapters.ts`: pemetaan `dueDate`/`daysBeforeEvent`/`externalVendor` ke model UI, normalisasi ID, serta payload whitelist. Pesanan dikirim sebagai integer atau null untuk melepas tautan. Tanggal kosong dikirim null, bukan string tanggal kosong; perilaku clearing ini masih perlu diuji pada backend dengan akun login karena Swagger tidak menandai dueDate nullable secara eksplisit.
- `repository.ts`: endpoint dan metode HTTP.
- `service.ts`: ringkasan, pengambilan semua halaman untuk ekspor, dan rekonsiliasi template.
- `useWeddingProgress.ts`: state query dan request; useAsyncResource mencegah respons lama menimpa hasil request baru.
- `usePlanningMutation.ts`: proteksi submit ganda dan error penyimpanan.
- `components/`: form pengaturan, editor tugas, dan modal. Form mempertahankan input saat gagal dan mencegah penutupan modal selama penyimpanan.

Local storage bukan lagi sumber data checklist. Salinan lama tidak dihapus dan tidak otomatis dikirim ke server. Ekspor PDF mengambil seluruh halaman dari backend, bukan hanya hasil filter/halaman yang tampil. Modul PDF dan font Noto Sans dimuat saat pengguna mengunduh; PDF dibuat di browser dengan ringkasan acara, progres, tugas, subtugas, dan catatan.

## Keterbatasan kontrak saat ini

1. Belum ada endpoint summary. Service menghitung progres dari enam request list berukuran satu baris: seluruh tugas, completed, skipped, overdue, important TODO, important IN_PROGRESS. Total diambil dari metadata API, bukan panjang array. Skipped dikeluarkan dari penyebut progres. Filter daftar tidak memengaruhi ringkasan. Salah satu request gagal menyebabkan error ringkasan, bukan angka nol palsu.
2. Belum ada endpoint bulk/template. Saat pengguna menyimpan pengaturan atau membuat checklist, frontend membaca tugas yang sudah ada dan mengirim POST untuk template yang belum ada. Proses berurutan mempertahankan hasil yang sudah tersimpan jika request berikutnya gagal. Retry membaca ulang server sebelum melanjutkan. Matching menggunakan kategori/judul atau panduan/offset template sehingga perubahan judul tidak langsung menghasilkan duplikasi. Ini bukan pengganti jaminan idempotensi lintas tab/perangkat.
3. Endpoint DELETE tersedia, tetapi tidak ditambahkan ke UI karena alur halaman saat ini memakai status “Tidak diperlukan”.

Untuk pengembangan backend berikutnya, endpoint summary dan operasi template atomik dengan templateId unik per customer akan mengurangi jumlah request dan menjamin tidak ada duplikasi ketika dua perangkat membuat checklist bersamaan.

## Validasi

Unit test memeriksa pemetaan DTO, clearing payload, query, ringkasan global, kegagalan request, pengambilan semua halaman saat page size dibatasi server, dan retry template setelah kegagalan parsial. Build production juga dijalankan. Pengujian tulis terhadap backend live memerlukan sesi customer; implementasi ini tidak membuat akun atau mengubah data live selama pengembangan.
