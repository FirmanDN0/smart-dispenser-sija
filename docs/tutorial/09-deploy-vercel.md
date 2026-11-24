# TUTORIAL 09: DEPLOY NEXT.JS KE VERCEL
## Smart Dispenser IoT — Mempublikasikan Website & API ke Cloud Publik

Tutorial ini menjelaskan cara mengunggah kode ke GitHub dan melakukan *deployment* ke platform Vercel agar backend Next.js mendapatkan URL HTTPS publik yang dapat diakses oleh ESP32 dari jaringan internet mana pun.

---

### Langkah 1: Mempersiapkan Git Repository Lokal
1. Buka terminal di VS Code pada root project:
   ```bash
   git init
   ```
2. Pastikan file `.gitignore` telah ada dan melindungi file kredensial rahasia. Periksa bahwa file-file berikut **TIDAK AKAN ter-commit**:
   - `web/.env.local`
   - `firmware/secrets.py`
   - `node_modules`
3. Tambahkan seluruh file ke git:
   ```bash
   git add .
   git commit -m "feat: smart dispenser IoT release v1.0 ukl3 sija"
   ```

---

### Langkah 2: Membuat Repository di GitHub
1. Buka browser dan buka situs: **`https://github.com/`**
2. Masuk ke akun GitHub Anda.
3. Klik tombol hijau **New** (Buat repository baru).
4. Beri nama repository: `smart-dispenser-ukl3`.
5. Pilih visibilitas **Public** atau **Private**.
6. Jangan centang *README* atau *.gitignore* (karena sudah ada di lokal).
7. Klik **Create repository**.
8. Salin perintah git remote yang diberikan oleh GitHub, lalu jalankan di terminal VS Code Anda:
   ```bash
   git branch -M main
   git remote add origin https://github.com/[username-anda]/smart-dispenser-ukl3.git
   git push -u origin main
   ```

---

### Langkah 3: Menghubungkan Repository ke Vercel
1. Buka situs Vercel: **`https://vercel.com/`**
2. Masuk menggunakan akun GitHub Anda (*Continue with GitHub*).
3. Pada dashboard Vercel, klik tombol **"Add New..."** $\rightarrow$ **Project**.
4. Cari repository `smart-dispenser-ukl3` yang baru saja Anda buat, lalu klik **Import**.

---

### Langkah 4: Mengonfigurasi Root Directory & Environment Variables di Vercel
Ini adalah langkah krusial:
1. **Konfigurasi Root Directory**:
   - Di bagian *Root Directory*, klik tombol **Edit**.
   - Pilih folder: **`web`** (karena aplikasi Next.js berada di dalam subfolder `web/`).
   - Klik **Continue**.
2. **Konfigurasi Environment Variables**:
   - Buka bagian **Environment Variables**.
   - Masukkan seluruh variabel dari file `web/.env.local` Anda satu per satu:
     * `NEXT_PUBLIC_FIREBASE_API_KEY`
     * `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     * `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
     * `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     * `NEXT_PUBLIC_FIREBASE_APP_ID`
     * `FIREBASE_ADMIN_PROJECT_ID`
     * `FIREBASE_ADMIN_CLIENT_EMAIL`
     * `FIREBASE_ADMIN_PRIVATE_KEY` *(tempel lengkap beserta tanda petik ganda)*
     * `DEVICE_TOKEN_SHA256`
     * `SESSION_SECRET`
3. Klik tombol biru **Deploy**.
4. Tunggu proses build selama $\approx 1 - 2\text{ menit}$.
5. Vercel akan menampilkan animasi kembang api tanda *Deployment Selesai* (*Congratulations!*).

---

### Langkah 5: Menyalin URL Publik Vercel
1. Di halaman detail project Vercel, Anda akan melihat domain publik, misalnya:
   **`https://smart-dispenser-ukl3.vercel.app`**
2. Buka URL tersebut di browser smartphone atau laptop Anda. Website Smart Dispenser Anda sekarang sudah online di internet global!

---

### Langkah 6: Memperbarui URL API pada ESP32
1. Buka aplikasi **Thonny IDE**.
2. Buka file **`secrets.py`** yang ada di dalam ESP32.
3. Ubah nilai `API_BASE_URL` menjadi URL domain publik Vercel Anda:
   ```python
   # secrets.py pada ESP32
   API_BASE_URL = "https://smart-dispenser-ukl3.vercel.app"
   ```
4. Simpan file (`Ctrl + S`).
5. Jalankan ulang `test_cloud.py` di Thonny untuk memastikan ESP32 berhasil berbicara dengan server Vercel Anda di cloud!

Lanjutkan ke: **[Tutorial 10: Pengujian Akhir Komprehensif Hari-H UKL](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/10-pengujian-akhir-ukl.md)**.
