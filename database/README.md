# Database Structure

Folder `database/` sekarang dibagi per domain agar lebih rapi saat deploy di VPS.

## Struktur

```text
database/
  schema.sql
  user/
    schema.sql
  session/
    schema.sql
  subscription/
    schema.sql
  history/
    schema.sql
  content/
    schema.sql
```

## Cara Pakai

Jika ingin import cepat satu langkah, gunakan:

```text
database/schema.sql
```

Jika ingin maintain schema per domain, gunakan file sesuai folder:

- `database/user/schema.sql`
- `database/session/schema.sql`
- `database/subscription/schema.sql`
- `database/history/schema.sql`
- `database/content/schema.sql`

## Catatan

- `schema.sql` tetap menjadi file utama untuk bootstrap database baru.
- Folder domain dipakai untuk memudahkan pengelolaan schema di VPS.
- Struktur ini cocok jika nanti Anda ingin menambah migrasi atau script import per modul.
