# Deploy ke Railway

Dokumen ini khusus untuk deploy `SebelumTutup` ke Railway. Jalur ini cocok kalau kamu tidak punya VPS mentah dan hanya punya project Railway.

## Ringkasnya

Untuk Railway, arsitektur paling sederhana adalah:

- 1 service web untuk app ini
- 1 service PostgreSQL bawaan Railway

Pada jalur Railway ini:

- `nginx/` tidak dipakai
- `docker-compose.yml` tidak dipakai
- app akan jalan dari `Dockerfile` di root repo
- frontend tetap diserve oleh Express, jadi domain publik cukup satu

## Sebelum mulai

Siapkan:

- repo ini sudah ada di GitHub
- akun Railway
- project Railway kosong atau baru

## Opsi deploy paling gampang

### Opsi A: via GitHub

1. Push repo ke GitHub.
2. Di Railway, buat project baru.
3. Pilih deploy dari GitHub repo.
4. Pastikan service web membaca repo root ini.
5. Railway akan mendeteksi `Dockerfile` dan build image dari sana.

### Opsi B: via Railway CLI

Install CLI:

```bash
npm install -g @railway/cli
railway login
```

Lalu dari root repo:

```bash
railway init
railway up
```

## Tambahkan PostgreSQL

Di project Railway:

1. Klik `New`
2. Tambahkan `PostgreSQL`

Biarkan service database hidup di project yang sama.

## Konfigurasi service web

Repo ini sudah menyertakan [railway.json](./railway.json) supaya Railway memakai:

- builder `DOCKERFILE`
- `Dockerfile` di root
- healthcheck path `/health`
- restart policy dasar

Sekarang set environment variables pada service web.

## Variables yang perlu diisi

Minimal isi variable berikut pada service web:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
CLIENT_ORIGIN=https://${{RAILWAY_PUBLIC_DOMAIN}}
SITE_NAME=SebelumTutup
SITE_CLOSE_AT=2026-05-22T23:59:59+07:00
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ganti-password-admin-ini
SESSION_SECRET=ganti-dengan-secret-panjang-random
COOKIE_SECRET=ganti-dengan-secret-cookie-random
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_POSTS=8
RATE_LIMIT_MAX_COMMENTS=20
RATE_LIMIT_MAX_REPORTS=10
```

Catatan:

- Jika nama service database kamu bukan `Postgres`, ganti referensi `DATABASE_URL` sesuai nama service itu di Railway.
- `CLIENT_ORIGIN` wajib berupa URL valid karena dicek saat startup.
- Jangan isi `PORT` manual kecuali kamu memang butuh override. App ini sudah membaca `PORT` yang di-inject Railway.

## Generate domain publik

Di service web:

1. Masuk ke `Settings`
2. Buka `Networking`
3. Pada `Public Networking`, klik `Generate Domain`

Setelah domain aktif, `RAILWAY_PUBLIC_DOMAIN` akan tersedia untuk dipakai oleh `CLIENT_ORIGIN`.

## Deploy pertama

Setelah variables terisi:

1. Trigger deploy
2. Tunggu sampai healthcheck `/health` lolos
3. Buka domain Railway yang dibuat

Kalau deploy sukses, landing page akan terbuka dari domain publik Railway.

## Migrasi database

`Dockerfile` project ini menjalankan:

```sh
npm run db:migrate && npm run start
```

Jadi saat container start:

- migration akan di-apply dengan `prisma migrate deploy`
- server lalu jalan normal

## Seed data demo

Sesudah deploy pertama sukses, jalankan seed satu kali agar feed terlihat hidup.

Paling gampang:

1. buka shell service web dari Railway
2. jalankan:

```bash
npm run db:seed
```

Kalau pakai Railway CLI, kamu juga bisa masuk ke container lalu menjalankan command yang sama.

## Verifikasi cepat

Sesudah deploy:

1. buka `/`
2. buka `/feed`
3. buat post baru
4. buka tab kedua untuk cek realtime
5. buka `/admin`
6. login pakai kredensial admin
7. cek `/health`

Healthcheck publik:

```text
https://<domain-kamu>/health
```

## Kalau deploy gagal

Cek urutan ini:

1. pastikan `DATABASE_URL` benar-benar terisi dari service Postgres Railway
2. pastikan `SITE_CLOSE_AT` format ISO valid
3. pastikan `CLIENT_ORIGIN` berupa URL valid
4. pastikan password admin minimal 8 karakter
5. lihat logs deploy di Railway

## Catatan penting untuk Railway

- Railway bukan VPS SSH biasa. Jadi alur `rsync`, `scp`, atau `ssh root@ip` tidak jadi jalur utama.
- Kalau kamu masuk ke shell Railway, itu adalah shell service/container Railway.
- Untuk app ini, satu domain publik sudah cukup karena frontend diserve oleh backend Express.
- Untuk demo 30 hari dengan traffic ringan, Railway cukup masuk akal. Tetap pantau usage dan status plan akunmu.
