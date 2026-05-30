# 📄 Product Requirements Document (PRD)
**Project Name:** SaaS Server Pulsa UMKM  
**Version:** 1.0.0  
**Tech Stack:** Next.js (App Router), Supabase (PostgreSQL), Vercel, Google Apps Script (GAS)  
**API Integration:** DigiFlazz (H2H Supplier)  

---

## 1. 🚀 Ringkasan Eksekutif (Executive Summary)
Aplikasi ini adalah platform *Software as a Service* (SaaS) yang memungkinkan pemilik server (Aggregator) untuk mendistribusikan produk digital (Pulsa, Token PLN, E-Wallet) kepada mitra UMKM dan pemilik konter. Sistem menggunakan model **Induk Deposit**, di mana mitra melakukan top-up saldo ke dalam aplikasi, dan aplikasi melakukan pemotongan saldo secara internal sebelum mengeksekusi pembelian riil ke API DigiFlazz.

## 2. 🎯 Tujuan Produk (Product Goals)
1. **Keamanan Finansial:** Mencegah kebocoran saldo dan *double-spending* (race conditions) saat terjadi transaksi bersamaan.
2. **Performa Tinggi:** Memastikan antarmuka aplikasi berjalan ringan dan responsif untuk digunakan di perangkat *mobile* oleh penjaga konter.
3. **Pencatatan Otomatis:** Mengurangi beban administrasi dengan otomatisasi pencatatan laba/rugi transaksi.
4. **Skalabilitas:** Arsitektur *Clean/Modular* yang siap dikembangkan untuk ratusan mitra tanpa mengorbankan kecepatan.

---

## 3. 👥 Pengguna & Hak Akses (User Personas & Roles)

### 3.1. Admin (Pemilik Server)
* Memiliki kontrol penuh atas markup harga produk.
* Menyetujui atau menolak permintaan deposit manual dari Mitra.
* Melihat rekapitulasi seluruh transaksi dan keuntungan bersih.

### 3.2. Mitra (UMKM / Pemilik Konter)
* Mendaftar dan login ke dalam sistem.
* Melakukan permintaan *top-up* saldo deposit.
* Melihat katalog produk dengan harga yang sudah di-*markup* oleh Admin.
* Mengeksekusi transaksi pembelian untuk pelanggan mereka.
* Melihat riwayat transaksi dan status (Sukses/Gagal/Pending) milik tokonya sendiri.

---

## 4. 🛠️ Arsitektur Sistem & Alur (System Architecture)

* **Frontend:** Next.js 14+ (App Router, TypeScript, Tailwind CSS, Shadcn UI). Di-*deploy* di Vercel.
* **Backend/API Middleware:** Vercel Serverless Functions / Next.js Route Handlers. Digunakan untuk menyembunyikan API Key DigiFlazz dari sisi klien.
* **Database & Auth:** Supabase. Menggunakan `Row Level Security (RLS)` untuk mengisolasi data antar konter, dan `PostgreSQL RPC/Transactions` untuk memotong saldo.
* **Automation Bridge:** Google Apps Script (GAS) menerima *webhook* untuk mencatat laporan transaksi sukses ke Google Sheets.

---

## 5. ✨ Fitur Utama (Core Features)

### Fitur 1: Otentikasi & Manajemen Pengguna (Auth & User Management)
* **Kebutuhan:** Pengguna dapat mendaftar dan login menggunakan Email/Password.
* **Teknis:** Menggunakan Supabase Auth. Tabel `users` akan otomatis dibuat/diperbarui saat proses *sign-up*.

### Fitur 2: Sinkronisasi Katalog & Harga (Product Catalog)
* **Kebutuhan:** Sistem dapat menampilkan produk dari DigiFlazz dan menambahkan *markup* keuntungan.
* **Teknis:** 
  * Cron Job / API Endpoint untuk mengambil data dari `[POST] /v1/price-list` DigiFlazz.
  * Menyimpan "Harga Modal" (Harga Terbaik) dan menentukan "Harga Jual" di Supabase.

### Fitur 3: Sistem Deposit (Wallet System)
* **Kebutuhan:** Mitra dapat meminta penambahan saldo.
* **Teknis:** 
  * Mitra membuat *request* deposit di UI.
  * Admin menerima notifikasi dan melakukan validasi transfer bank.
  * Admin menekan tombol "Approve", Supabase menjalankan pembaruan nilai kolom `saldo` pada entitas `users`.

### Fitur 4: Mesin Transaksi Utama (Core Transaction Engine)
* **Kebutuhan:** Memproses pembelian pulsa/token pelanggan.
* **Teknis (Alur Kritis):**
  1. Frontend mengirim data `sku_code` dan `customer_no`.
  2. Backend memvalidasi ketersediaan saldo Mitra (`saldo >= harga_jual`).
  3. **Database Transaction (Locking):** Saldo Mitra dipotong dan disimpan.
  4. Backend memanggil API DigiFlazz `[POST] /v1/transaction`.
  5. Mencatat log ke tabel `transactions` dengan status awal `pending`.

### Fitur 5: Webhook & Update Status (Callback Handling)
* **Kebutuhan:** Mendengarkan laporan dari DigiFlazz jika pulsa sukses masuk atau gagal.
* **Teknis:**
  * Endpoint khusus (misal: `/api/webhook/digiflazz`).
  * Memvalidasi keaslian *request* menggunakan Secret/Signature HMAC.
  * Mengubah status transaksi di database dari `pending` menjadi `sukses` (atau me-*refund* saldo otomatis jika status `gagal`).

### Fitur 6: Ekspor Laporan Otomatis (Reporting to GAS)
* **Kebutuhan:** Rekapitulasi keuntungan harian.
* **Teknis:** Setelah status transaksi menjadi `sukses`, backend memanggil *webhook URL* milik Google Apps Script untuk menyisipkan (*append row*) data ke Google Sheets.

---

## 6. 🛡️ Syarat Keamanan (Security Requirements)
1. **No Client-Side API Keys:** Kunci `username` dan `api_key` DigiFlazz WAJIB disimpan di Vercel Environment Variables (`.env.local`), tidak boleh ada di berkas antarmuka.
2. **Row Level Security (RLS):** Supabase RLS harus diaktifkan untuk mencegah Mitra A membaca histori transaksi atau meretas saldo Mitra B.
3. **Atomic Transactions:** Pengurangan saldo harus dijalankan di sisi basis data menggunakan prosedur atomik (RPC) untuk memblokir eksekusi ganda jika tombol beli ditekan berulang kali dalam hitungan milidetik (*race condition*).

---

## 7. 📅 Fase Pengembangan (Milestones)
* **Fase 1 (Setup & Auth):** Inisialisasi Next.js, Supabase, Skema Database (ERD), dan sistem Login.
* **Fase 2 (Katalog & Deposit):** Tarik API Harga DigiFlazz, UI Admin untuk mengatur markup harga, UI Mitra untuk top-up.
* **Fase 3 (Core Transaction):** Logika pemotongan saldo (*Transaction Lock*), Tembak API Pembelian DigiFlazz, Handling Webhook (Sukses/Gagal/Refund).
* **Fase 4 (Dashboard & Laporan):** UI Riwayat Transaksi untuk Mitra, Integrasi Webhook ke Google Apps Script (Google Sheets) untuk Laporan Laba/Rugi.