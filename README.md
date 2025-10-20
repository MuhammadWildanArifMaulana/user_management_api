# User Management API (Panduan Bahasa Indonesia)

Minimal REST API untuk manajemen user dengan autentikasi (JWT), upload file ke Cloudinary, dan keamanan dasar (CORS, Helmet).

Panduan ini menjelaskan langkah-langkah lengkap: instalasi, pembuatan database, menjalankan server, membuka Swagger, serta langkah pengujian endpoint (Register, Login, CRUD, Upload Avatar).

## Prasyarat

- Node.js 18+ (disarankan Node 22)
- PostgreSQL (psql atau GUI seperti pgAdmin)
- Akun Cloudinary untuk upload avatar

## Variabel lingkungan (.env)

Buat file `.env` di root proyek dengan isi minimal berikut (ganti placeholder):

```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/user_management_api
JWT_SECRET=verysecretkeyhere
JWT_EXPIRES_IN=2h
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret
CORS_ORIGIN=http://localhost:3000
BCRYPT_SALT_ROUNDS=10
```

## Instal dependensi

```powershell
npm install
```

## Migration: buat tabel `users`

Jalankan file migration `migrations/create_users_table.sql` untuk membuat atau memperbarui tabel `users`:

Menggunakan `psql`:

```powershell
psql "postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/user_management_api" -f migrations/create_users_table.sql
```

Atau gunakan runner yang sudah ada (membaca `DATABASE_URL` dari `.env`):

```powershell
npm run migrate
```

Verifikasi kolom:

```powershell
psql "postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/user_management_api" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users';"
```

Pastikan tabel memiliki kolom: `id`, `username`, `email`, `password`, `role`, `avatar_url`, `created_at`, `updated_at`.

## Menjalankan server

Start biasa:

```powershell
npm start
```

Development (hot reload dengan nodemon):

```powershell
npx nodemon index.js
```

Periksa output: seharusnya muncul pesan database connected dan server running.

## Buka Swagger UI

Setelah server berjalan buka:

```
http://localhost:5000/api/docs
```

### Cara menggunakan Swagger untuk endpoint yang dilindungi

1. Register user (POST /api/auth/register) → kirim body JSON.
2. Login (POST /api/auth/login) → salin JWT dari respon (`token` atau `data.token`).
3. Klik tombol `Authorize` di Swagger dan masukkan token dengan format:
   - `Bearer <JWT_TOKEN>`
   - Atau cukup paste token jika UI meminta token saja.
4. Setelah authorized, request yang membutuhkan autentikasi akan otomatis mengirim header Authorization.

## Urutan pengujian (Langkah demi langkah)

Ikuti urutan ini di Swagger atau Postman:

1. Register (POST /api/auth/register)

Contoh body:

```json
{
  "username": "wildan",
  "email": "wildan@example.com",
  "password": "Password123!"
}
```

2. Login (POST /api/auth/login)

```json
{
  "email": "wildan@example.com",
  "password": "Password123!"
}
```

3. Authorize di Swagger: `Bearer <JWT>`

4. GET semua user (GET /api/users) — pastikan user muncul

5. GET user by id (GET /api/users/{id})

6. Update profil (PUT /api/users/{id}) — contoh body:

```json
{
  "username": "wildan_arif"
}
```

7. Upload avatar (POST /api/users/{id}/avatar)

- Gunakan `multipart/form-data`
- Field: `avatar` (file image/png atau image/jpeg)
- Setelah berhasil, GET /api/users/{id} harus menampilkan `avatar_url` yang valid.

8. Delete user (DELETE /api/users/{id}) — jika diperbolehkan oleh permission

## Verifikasi upload di Cloudinary

- Buka `avatar_url` dari respon di browser — harus menampilkan gambar.
- Atau login ke dashboard Cloudinary → Media Library untuk melihat asset yang diupload.

## Memeriksa CORS & Helmet aktif

Jalankan request HEAD ke server untuk melihat header:

```powershell
Invoke-WebRequest -Method Head -Uri http://localhost:5000/api/auth/register
```

Cek header seperti `x-frame-options`, `x-content-type-options` (Helmet) dan `access-control-allow-origin` (CORS).

## Tes otomatis (opsional)

Ada skrip sederhana `tests/integration.js` yang menguji register, login, list/get/update/upload (jika fixture tersedia), dan delete. Jalankan ketika server aktif:

```powershell
node tests/integration.js
```

Jika ingin menambahkan `npm` script seperti `test:integration`, bisa tambahkan.

## README: file penting yang harus ada di repo

- `.gitignore` harus berisi `.env` (sudah ada di repo Anda). Pastikan `.env` tidak ter-commit.
- Tambahkan `.env.example` (tanpa kredensial) agar orang lain tahu variabel apa yang diperlukan.

## Troubleshooting umum

- Error `column "created_at" does not exist`: jalankan `npm run migrate` dan restart server.
- Upload gagal: periksa kredensial Cloudinary pada `.env`.
- Token tidak bekerja di Swagger: coba paste token tanpa kata `Bearer `, atau gunakan Postman header manual.
