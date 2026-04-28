# Deploy VPS Debian 12

Panduan ini menargetkan 1 VPS Debian 12 publik dengan Docker Compose, PostgreSQL container, app container, dan Nginx container.

## 1. Update Server

```bash
sudo apt update
sudo apt upgrade -y
```

## 2. Install Docker & Compose Plugin

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Logout/login ulang agar group Docker aktif.

## 3. Copy Project

Dari mesin lokal:

```bash
rsync -av --exclude node_modules --exclude .env ./ user@IP_SERVER:/opt/sebelumtutup
```

Di server:

```bash
cd /opt/sebelumtutup
cp .env.example .env
```

## 4. Edit Env

Minimal ganti:

```text
NODE_ENV=production
CLIENT_ORIGIN=https://domain-kamu.com
SITE_CLOSE_AT=2026-05-22T23:59:59+07:00
ADMIN_USERNAME=admin-unik
ADMIN_PASSWORD=password-admin-kuat
SESSION_SECRET=random-panjang-minimal-32-karakter
COOKIE_SECRET=random-panjang-minimal-32-karakter
POSTGRES_DB=sebelumtutup
POSTGRES_USER=sebel
POSTGRES_PASSWORD=password-kuat
```

Di Docker Compose, `DATABASE_URL` container app dibentuk otomatis dari `POSTGRES_USER`, `POSTGRES_PASSWORD`, dan `POSTGRES_DB`. Nilai `DATABASE_URL` di `.env` tetap berguna untuk menjalankan command lokal di luar container.

## 5. Jalankan Compose

```bash
docker compose up -d --build
```

App akan menjalankan migration otomatis sebelum start.

Seed awal jika dibutuhkan:

```bash
docker compose exec app npm run db:seed
```

## 6. Firewall

Jika memakai UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 7. Domain

Buat DNS `A record`:

```text
domain-kamu.com -> IP_SERVER
```

Edit `CLIENT_ORIGIN` menjadi `https://domain-kamu.com`, lalu restart:

```bash
docker compose up -d
```

## 8. SSL Opsional

Konfigurasi repo ini memakai Nginx container port 80. Untuk SSL termudah, pasang reverse proxy host-level atau ubah Nginx container agar mount sertifikat.

Placeholder Certbot host-level:

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d domain-kamu.com
```

Setelah sertifikat ada, tambahkan server block 443 di `nginx/default.conf` dan mount `/etc/letsencrypt` ke container Nginx. Jangan lupa header WebSocket:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## 9. Update Aplikasi

```bash
cd /opt/sebelumtutup
git pull
docker compose up -d --build
```

Migration berjalan otomatis saat app start.

## 10. Lihat Log

```bash
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f db
```

## 11. Backup Database

Backup:

```bash
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-sebelumtutup.sql
```

Restore:

```bash
cat backup-sebelumtutup.sql | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## 12. Healthcheck

```bash
curl http://localhost/health
```

Response sukses berbentuk JSON `success: true`. Jika DB belum siap, endpoint mengembalikan 503.
