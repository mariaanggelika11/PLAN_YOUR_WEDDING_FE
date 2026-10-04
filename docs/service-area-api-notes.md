# Area layanan: frontend dan kebutuhan API

Frontend menggunakan pilihan kota/kabupaten untuk area bisnis, pilihan area bisnis untuk paket, dan dropdown pencarian di marketplace. Alamat kantor tetap terpisah. Venue memilih wilayah tempat venue berada.

## Kompatibilitas saat ini

- `serviceArea` tetap string, contoh `Kota Bandung, Kota Cimahi`. Data lama seperti `Jabodetabek` tetap dipertahankan; tidak ditebak atau diperluas otomatis.
- Produk baru dapat menyalin area bisnis. Ini salinan saat menyimpan, bukan hubungan yang otomatis mengikuti perubahan profil. Produk lama tetap memakai cakupannya sendiri sampai vendor mengubahnya.
- Marketplace mengambil `GET /vendor-products/filter-options`, memecah daftar berseparator koma/titik koma/baris baru, dan mengirim satu pilihan melalui `location` pada `GET /vendor-products`. Paginasi tetap dilakukan server.
- Kontrak Swagger 3 Oktober 2026: `location` melakukan partial match pada area produk, kota, atau provinsi vendor. Karena itu hasil belum merupakan jaminan cakupan lokasi acara. Frontend tidak menyaring hasil lagi sesudah pagination.

## Tambahan yang perlu backend siapkan

1. Daftar area layanan berdasarkan kode kota/kabupaten beserta nama dan provinsi, terpisah dari alamat bisnis. Sepakati sumber kode wilayah dengan frontend (saat ini wilayah.id).
2. Area produk beserta mode mengikuti bisnis atau cakupan khusus. Jelaskan apakah perubahan profil mengubah paket otomatis; sediakan migrasi data teks lama yang tidak mengarang cakupan.
3. Filter lokasi acara berdasarkan kode wilayah dan cakupan efektif produk, bukan alamat kantor. Untuk venue, gunakan lokasi venue.
4. Opsi filter lokasi terstruktur, konsisten dengan produk aktif yang ditampilkan. Kumpulan wilayah seperti Jabodetabek harus memiliki anggota eksplisit, termasuk perbedaan kota/kabupaten; jangan hanya substring.

Tidak ada perubahan backend atau database dalam pekerjaan ini.
