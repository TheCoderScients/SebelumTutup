# SebelumTutup

SebelumTutup adalah website demo full-stack untuk arena opini singkat / curhat anonim semi-live. Pengunjung masuk sebagai guest, memilih nickname atau anonim, membuat post, komentar, reaksi emoji, vote, report konten, dan melihat feed update realtime via Socket.IO.

## Fitur

- Landing page dengan countdown tanggal penutupan dari `SITE_CLOSE_AT`.
- Guest onboarding tanpa email/OAuth, memakai cookie httpOnly dan preferensi lokal.
- Feed post terbaru, trending, dan paling ramai.
- Detail post dengan komentar flat-thread realtime.
- Reaksi default: 🔥 😂 💀 ❤️.
- Upvote/downvote satu status per guest session.
- Online users count realtime.
- Report post/komentar.
- Admin panel sederhana dengan login cookie httpOnly, daftar report, delete post/komentar, resolve report, statistik, dan log moderasi.
- Read-only mode otomatis setelah `SITE_CLOSE_AT`: create post, komentar, reaksi, dan vote dinonaktifkan.

## Stack

- Frontend: React, Vite, TypeScript, React Router, Tailwind CSS, Socket.IO client.
- Backend: Node.js LTS, Express, TypeScript, Socket.IO, Prisma, PostgreSQL.
- Security dasar: helmet, CORS dev terbatas, rate limit, Zod validation, sanitasi HTML, cookie admin httpOnly.
- Production: Docker Compose + PostgreSQL + Nginx reverse proxy dengan WebSocket support.

## Struktur

```text
client/              React + Vite UI
server/              Express API + Socket.IO
prisma/              schema, migration SQL, seed data
nginx/               reverse proxy config
scripts/             folder utilitas opsional
docker-compose.yml   app + db + nginx
Dockerfile           production image
```

## Local Development

1. Pasang dependency:

```bash
npm install
```

2. Buat env lokal:

```bash
cp .env.example .env
```

3. Jalankan PostgreSQL lokal. Cara paling gampang jika Docker tersedia:

```bash
docker compose up -d db
```

4. Generate Prisma Client, migrasi, lalu seed:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Jalankan dev server:

```bash
npm run dev
```

Frontend dev: `http://localhost:5173`  
Backend API: `http://localhost:4000`

## Local Development Tanpa PostgreSQL Sistem

Kalau kamu tidak punya Postgres atau Docker di mesin lokal, repo ini juga bisa memakai embedded PostgreSQL user-space.

Siapkan database lokal persisten:

```bash
npm run db:local:prepare
```

Lalu jalankan stack dev:

```bash
npm run dev:local
```

Ini akan menyalakan:

- embedded PostgreSQL di `127.0.0.1:55432`
- Express dev server di `http://localhost:4000`
- Vite dev server di `http://localhost:5173`

## Smoke Test End-to-End

Untuk verifikasi otomatis penuh tanpa PostgreSQL sistem:

```bash
npm run smoke:e2e
```

Script ini akan:

- start embedded PostgreSQL sementara
- apply migration
- seed data
- build client + server
- start app
- cek halaman utama
- cek guest bootstrap, post, comment, reaction, vote, report, admin, dan Socket.IO

## Build & Start

```bash
npm run build
npm run start
```

Di mode production, Express men-serve hasil build `client/dist`.

## Production Docker Compose

```bash
cp .env.example .env
# edit .env dulu
npm run docker:up
```

Nginx expose port `80` dan proxy ke app. App otomatis menjalankan `prisma migrate deploy` sebelum start.

Stop stack:

```bash
npm run docker:down
```

## Deploy ke Railway

Kalau kamu tidak pakai VPS mentah dan cuma punya Railway, pakai jalur deploy Railway. Untuk skenario ini:

- abaikan `docker-compose.yml`
- abaikan `nginx/`
- deploy app dari `Dockerfile` root
- tambahkan PostgreSQL bawaan Railway di project yang sama

Panduan lengkapnya ada di [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md).

## Env Penting

- `DATABASE_URL`: koneksi PostgreSQL untuk command lokal di luar Docker.
- `CLIENT_ORIGIN`: origin frontend saat development, contoh `http://localhost:5173`.
- `SITE_NAME`: nama situs.
- `SITE_CLOSE_AT`: tanggal tutup ISO, contoh `2026-05-22T23:59:59+07:00`.
- `ADMIN_USERNAME`: username admin.
- `ADMIN_PASSWORD`: password admin, wajib diganti production.
- `SESSION_SECRET` dan `COOKIE_SECRET`: ganti dengan string acak panjang.
- `RATE_LIMIT_*`: batas create post, komentar, dan report per window.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: dipakai Docker Compose untuk DB dan membentuk `DATABASE_URL` app container.

Default testing dari `.env.example`:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-admin
```

Ganti keduanya sebelum production.

## API Utama

- `POST /api/guest/bootstrap`
- `GET /api/site/stats`
- `GET /api/posts?sort=new|trending|active&page=1&limit=12&category=random`
- `POST /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts/:id/comments`
- `POST /api/posts/:id/reactions/toggle`
- `POST /api/posts/:id/vote`
- `POST /api/reports`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/reports`
- `POST /api/admin/reports/:id/resolve`
- `DELETE /api/admin/posts/:id`
- `DELETE /api/admin/comments/:id`
- `GET /api/admin/stats`
- `GET /health`

Response error konsisten:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input tidak valid"
  }
}
```

## Socket Events

Server mengirim event:

- `site:online_count`
- `post:created`
- `post:updated`
- `post:deleted`
- `comment:created`
- `reaction:updated`
- `vote:updated`

Client detail post juga mengirim `post:join` dan `post:leave` untuk subscribe komentar per post.

## Trending Logic

Trending dihitung sederhana di backend:

```text
trendScore = (voteScore * 3) + (commentCount * 2) + reactionCount - (ageHours * 0.15)
```

Artinya vote dan komentar punya bobot lebih besar, reaksi tetap membantu, dan post lama perlahan turun agar feed tidak membeku.

## Read-Only Mode

Jika waktu sekarang sudah melewati `SITE_CLOSE_AT`, backend menolak aksi:

- create post
- create comment
- toggle reaction
- vote

Landing/feed/detail tetap bisa dibaca, report tetap bisa dikirim, dan admin tetap bisa login untuk moderasi.

## Script

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:migrate:dev`
- `npm run db:seed`
- `npm run db:local:start`
- `npm run db:local:prepare`
- `npm run dev:local`
- `npm run smoke:e2e`
- `npm run docker:up`
- `npm run docker:down`
