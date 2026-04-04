# Content Backend Plan

## Fokus

Backend ini memindahkan `materi`, `soal`, dan `tryout` dari file JSON ke database agar:

- bisa difilter lebih cepat
- bisa dicari lewat API
- siap untuk admin CRUD di tahap berikutnya
- frontend tidak perlu selalu membaca file mentah

## Struktur Tabel

Tabel konten yang sekarang tersedia di `database/schema.sql`:

- `content_subjects`
- `materials`
- `material_sections`
- `question_sets`
- `questions`
- `question_options`
- `question_tags`
- `question_tag_map`

## Sumber Import

- `data/materi_index.json`
- `data/soal_index.json`
- `data/tryout_matrix_index.json`

## Cara Import

1. Pastikan schema database sudah di-import.
2. Pastikan environment database sudah terisi.
3. Jalankan command berikut:

```bash
npm run import:content
```

Importer akan:

- membuat subject dari kategori dan mapel
- mengimpor materi dan section
- mengimpor practice set dari folder `soal`
- mengimpor tryout set dari folder `tryout`
- membuat question option dan tag map

## Endpoint API

### Materials

- `GET /api/materials`
- `GET /api/materials/[slug]`

Query list yang didukung:

- `category`
- `level`
- `subject`
- `q`
- `limit`

### Question Sets

- `GET /api/question-sets`
- `GET /api/question-sets/[slug]`

Query list yang didukung:

- `category`
- `level`
- `subject`
- `sourceKind=practice|tryout`
- `mode`
- `q`
- `limit`

### Questions

- `GET /api/questions`

Query yang didukung:

- `set`
- `category`
- `topic`
- `difficulty`
- `sourceKind=practice|tryout`
- `limit`
- `offset`

## Catatan Arsitektur

- Konten tetap bisa dipelihara di JSON sebagai source of truth awal.
- Database dipakai sebagai read model untuk frontend dan admin.
- Tahap berikutnya yang paling natural adalah membuat admin CRUD untuk publish/unpublish dan edit konten dari panel.
