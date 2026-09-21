# Integrasi notifikasi

Kontrak diperiksa dari Swagger `/api-json` pada 21 September 2026.

- `GET /notifications?pageNumber=1&pageSize=10&isRead=false`:
  response envelope `data: { data: AppNotification[], total, pageNumber, pageSize, unreadCount }`.
  `isRead` dihilangkan untuk semua notifikasi. `unreadCount` dipakai sebagai jumlah global,
  tidak dihitung dari isi halaman.
- `PUT /notifications/:id/read`: menandai satu notifikasi; response `data: AppNotification`.
- `PUT /notifications/read-all`: menandai seluruh notifikasi user login;
  response `data: { updated: number }`.
- Semua request menggunakan Bearer token melalui API client existing; tidak mengirim user ID.

## Frontend

`features/notifications/` memisahkan tipe, query/validasi link, repository, provider,
item, dropdown lonceng, dan halaman. Customer/vendor memakai halaman yang sama;
lonceng pada AppShell juga melayani admin. Tidak ada fallback mock.

Provider menyinkronkan jumlah belum dibaca dan lima notifikasi terbaru. Halaman memuat
10 item per halaman dari server, dengan filter Semua / Belum dibaca / Sudah dibaca.
Setelah PUT berhasil, daftar dan counter dimuat ulang. Kegagalan PUT menampilkan error
serta membiarkan item tetap bisa dicoba kembali; tidak dianggap sukses otomatis.
Data provider diisolasi per session dan dibersihkan saat akun berubah.

Refresh saat membuka lonceng, kembali ke tab/fokus, dan setiap 60 detik saat tab terlihat.
Tidak ada websocket/SSE pada kontrak yang diperiksa. Timestamp mengikuti bahasa dan
zona waktu browser. Teks judul/pesan ditampilkan sebagaimana dikirim backend.

`actionUrl` hanya diizinkan untuk path internal sesuai role login. URL eksternal,
protokol javascript, backslash, dan traversal ditolak. Tombol detail tetap bisa membuka
halaman tujuan jika penandaan baca gagal; pesan error status baca tetap tersedia.
Pembuatan notifikasi, penjadwalan reminder, dan ownership tetap tanggung jawab backend.

## Validasi

- `npm run typecheck`
- `npm test` (query false/true/semua dan validasi keamanan action URL)
- `npm run build`
- Browser lokal dengan API intercept untuk customer/vendor: filter, pagination,
  single/all read, kegagalan update dan retry, sinkronisasi dropdown.

Skrip lint existing (`next lint`) belum memiliki konfigurasi ESLint dan meminta setup
interaktif. Tidak ada perubahan tooling/dependency untuk integrasi ini.
