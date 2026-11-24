# TUTORIAL 02: MENGHUBUNGKAN FIREBASE KE NEXT.JS
## Smart Dispenser IoT — Konfigurasi Environment & Kredensial Server

Tutorial ini memandu Anda memasukkan kredensial Firebase yang telah didapatkan pada Tutorial 01 ke dalam aplikasi Next.js secara aman.

---

### Langkah 1: Membuka Folder Proyek di VS Code
1. Buka aplikasi **Visual Studio Code**.
2. Klik menu **File** $\rightarrow$ **Open Folder...**
3. Arahkan dan pilih folder: `c:\XII SIJA 2\IOT\smart-dispenser`
4. Buka terminal terintegrasi di VS Code dengan menekan shortcut ``Ctrl + ` `` (Backtick) atau menu **Terminal** $\rightarrow$ **New Terminal**.

---

### Langkah 2: Membuat File Konfigurasi `.env.local`
1. Masuk ke folder web pada terminal:
   ```bash
   cd web
   ```
2. Salin template `.env.example` menjadi `.env.local`:
   - Pada Windows PowerShell:
     ```powershell
     Copy-Item .env.example .env.local
     ```
3. Buka file `web/.env.local` di editor VS Code.

---

### Langkah 3: Mengisi Kredensial Klien Publik (Browser)
Isi nilai-nilai publik yang Anda peroleh dari Web App Firebase pada Tutorial 01 Langkah 5:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=smart-dispenser-sija.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://smart-dispenser-sija-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=smart-dispenser-sija
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

*Penjelasan:* Variabel dengan awalan `NEXT_PUBLIC_` dapat dibaca oleh browser untuk mendengarkan perubahan data sensor secara realtime melalui WebSocket Firebase Web SDK.

---

### Langkah 4: Mengisi Kredensial Rahasia Server (Firebase Admin SDK)
Buka file JSON Service Account yang telah Anda unduh pada Tutorial 01 Langkah 6 menggunakan VS Code. Salin nilainya ke dalam `.env.local`:

```env
FIREBASE_ADMIN_PROJECT_ID=smart-dispenser-sija
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@smart-dispenser-sija.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**PERHATIAN FORMAT PRIVATE KEY:**
- Pastikan nilai `FIREBASE_ADMIN_PRIVATE_KEY` diapit oleh tanda petik ganda (`"..."`).
- Jangan menghapus karakter `\n` di dalam teks kunci, karena tanda petik ganda memastikan baris baru terbaca dengan benar oleh Node.js.

---

### Langkah 5: Mengonfigurasi Hash Token Perangkat Keras
Tambahkan token otentikasi hardware yang sama dengan yang akan disimpan di ESP32:

```env
DEVICE_TOKEN_SHA256=03ff1e2465f3e6d9030703ff2b76b936221ccdb169bde59e3364f7e6d8f83cbd
DEFAULT_DEVICE_ID=dispenser01
SESSION_SECRET=sija_rahasia_sesi_siswa_2026_super_aman
```

---

### Langkah 6: Menjalankan Server Lokal Next.js
1. Pastikan Anda berada di direktori `web`:
   ```bash
   pnpm run dev
   ```
2. Terminal akan menampilkan pesan:
   ```text
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
   ✓ Ready in 1.8s
   ```
3. Buka browser dan kunjungi: **`http://localhost:3000/setup`**

---

### Langkah 7: Memverifikasi Koneksi Melalui Asisten Setup
1. Pada halaman **`http://localhost:3000/setup`**, Anda akan melihat panel diagnostik otomatis:
   - **Bagian 1: Verifikasi Environment Variables**: Seluruh baris harus berstatus warna hijau **`TERPASANG`**.
   - **Bagian 2: Konektivitas Firebase RTDB**: Harus berstatus **`BERHASIL (Ready)`** dan **`TERHUBUNG`**.
2. Jika ada status berwarna merah, periksa kembali apakah ada nama variabel yang salah ketik atau tanda petik yang terlewat pada file `.env.local`.

---

### Troubleshooting Masalah Umum
- **Error: `Invalid PEM formatted message`**:
  *Penyebab:* Nilai `FIREBASE_ADMIN_PRIVATE_KEY` terpotong atau tidak diapit tanda petik ganda `"..."`.
  *Solusi:* Salin ulang seluruh baris `private_key` dari file JSON dan pastikan tanda petik ganda ada di awal dan akhir.
- **Error: `Permission Denied` saat mengakses database**:
  *Penyebab:* Realtime Database Rules belum dipublikasikan atau URL salah region.
  *Solusi:* Buka kembali tab Rules di Firebase Console dan pastikan isi `database.rules.json` telah dipublikasikan.

Lanjutkan ke: **[Tutorial 03: Setup Akun Siswa & Login PIN](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/03-login-siswa.md)**.
