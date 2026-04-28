# QA Checklist

Gunakan dua browser atau dua tab incognito untuk mengecek realtime.

## Guest Bootstrap

- [ ] Buka `/`, modal guest muncul pada kunjungan pertama.
- [ ] Pilih nickname, refresh, identitas tetap dikenali.
- [ ] Pilih mode anonim, nama tampil sebagai `Anonim`.

## Landing

- [ ] Countdown tampil di landing, navbar, dan footer.
- [ ] Statistik post, komentar, reaksi, online tampil.
- [ ] Tombol masuk feed membuka `/feed`.

## Create Post

- [ ] Form menolak judul/isi terlalu pendek.
- [ ] Title maksimal 80 karakter.
- [ ] Body maksimal 500 karakter.
- [ ] Kategori tersimpan benar.
- [ ] Post baru muncul di feed tanpa refresh di tab lain.

## Feed

- [ ] Sort `Terbaru` menampilkan post terbaru.
- [ ] Sort `Trending` memakai interaksi + umur.
- [ ] Sort `Paling ramai` memprioritaskan komentar/reaksi.
- [ ] Filter kategori bekerja.
- [ ] Card membuka `/post/:id`.

## Comment

- [ ] Detail post tampil lengkap.
- [ ] Komentar baru tersimpan.
- [ ] Komentar baru muncul realtime di tab detail lain.
- [ ] Count komentar di feed ikut update.

## Reaction

- [ ] Tombol 🔥 😂 💀 ❤️ bisa toggle.
- [ ] Toggle kedua menarik reaksi.
- [ ] Satu session hanya punya satu reaksi per emoji.
- [ ] Count reaksi update realtime.

## Vote

- [ ] Upvote menaikkan skor.
- [ ] Downvote menurunkan skor.
- [ ] Klik vote aktif sekali lagi menghapus vote.
- [ ] Pindah upvote ke downvote mengubah skor dengan benar.
- [ ] Skor update realtime.

## Online Count

- [ ] Buka tab baru, online count naik.
- [ ] Tutup tab, online count turun.

## Report

- [ ] Tombol report tersedia di post dan komentar.
- [ ] Alasan terlalu pendek ditolak.
- [ ] Report masuk ke admin panel.

## Admin Login

- [ ] `/admin` menampilkan form login jika belum login.
- [ ] Credential salah ditolak.
- [ ] Credential dari env berhasil login.
- [ ] Cookie admin httpOnly terset.
- [ ] Logout menghapus akses admin.

## Admin Moderation

- [ ] Report terbuka tampil.
- [ ] Resolve report mengubah status jadi resolved.
- [ ] Delete comment menyembunyikan komentar dan mencatat log.
- [ ] Delete post menyembunyikan post dan komentar terkait.
- [ ] Delete post mengirim event `post:deleted` ke client.

## Read-Only Mode

- [ ] Set `SITE_CLOSE_AT` ke tanggal masa lalu.
- [ ] Landing menampilkan notice demo sudah ditutup.
- [ ] Create post dinonaktifkan.
- [ ] Komentar, reaction, dan vote ditolak backend.
- [ ] Feed dan detail tetap bisa dibaca.
- [ ] Admin tetap bisa login.

## Responsive

- [ ] Mobile 360px: navbar, feed, composer, detail, admin tidak overlap.
- [ ] Tablet: layout feed tetap rapi.
- [ ] Desktop: composer sticky dan feed nyaman dipakai.
