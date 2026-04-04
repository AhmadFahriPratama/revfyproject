# Revfy cPanel Deploy

## Backend Database yang Disarankan

Untuk cPanel, backend database yang paling aman dan umum adalah `MySQL` atau `MariaDB`.

Alasan:
- native di hampir semua cPanel
- mudah dibuat dari menu `MySQL Databases`
- cocok untuk Next.js Node app melalui driver `mysql2`
- tidak perlu layanan tambahan seperti PostgreSQL server terpisah

## Environment Variables

Set environment variable berikut di Node.js App cPanel atau file `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=revfy_app
DB_USER=revfy_user
DB_PASSWORD=your_strong_password
BALREV_ADMIN_PASSWORD=change_this_admin_password
```

## Setup Database

1. Buat database MySQL dari cPanel.
2. Buat user database.
3. Assign user ke database dengan semua privilege yang diperlukan.
4. Import file `database/schema.sql` lewat phpMyAdmin.
5. Set `BALREV_ADMIN_PASSWORD` untuk bootstrap login pertama user admin `balrev`.

## API yang Sudah Disiapkan

- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/subscription`
- `PUT /api/subscription`
- `GET /api/progress?tier=...&slug=...`
- `PUT /api/progress`
- `DELETE /api/progress`
- `GET /api/attempts?limit=10`
- `POST /api/attempts`
- `GET /api/admin/summary`

## Preview Lokal

Saat development, preview app bisa dibuka di:

```text
http://127.0.0.1:3000
```

## Fallback Behavior

- Jika database aktif: login memakai cookie session backend, simulasi akan autosave progress ke backend, dan dashboard membaca attempt dari database.
- Jika database belum aktif: frontend tetap berjalan normal dengan fallback ke `localStorage` browser.
- Leaderboard di dashboard tetap lokal per browser agar preview multi-user tetap ringan.

## Pola Login Saat Ini

- User biasa: jika belum ada di database, akun dibuat otomatis saat login pertama.
- User `balrev`: saat login pertama akan dibootstrap sebagai admin menggunakan `BALREV_ADMIN_PASSWORD`.
- Setelah akun ada, login berikutnya memakai password hash yang tersimpan di database.

## Catatan Deploy

- App ini mengasumsikan cPanel Anda mendukung `Node.js App`.
- Jika hosting hanya PHP-only tanpa Node.js runtime, Next.js app ini tidak bisa dijalankan penuh di sana.
- Untuk performa dan kompatibilitas, gunakan Node.js LTS yang tersedia di cPanel.
