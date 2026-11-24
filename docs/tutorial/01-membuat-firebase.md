# TUTORIAL 01: MEMBUAT PROYEK FIREBASE DARI NOL
## Smart Dispenser IoT — Panduan Klik-demi-Klik Pemula

Tutorial ini menjelaskan langkah demi langkah cara membuat project Firebase, mengaktifkan Realtime Database pada region Asia Tenggara, dan mengonfigurasi aturan keamanan (*Security Rules*).

---

### Langkah 1: Buka Firebase Console & Login Google
1. Buka browser Anda (Google Chrome disarankan).
2. Kunjungi alamat: **`https://console.firebase.google.com/`**
3. Klik tombol **Sign in** di pojok kanan atas, lalu masuk menggunakan akun Google Anda.

---

### Langkah 2: Buat Project Baru
1. Pada halaman utama Firebase Console, klik tombol besar **"Add project"** (atau **"Tambahkan project"**).
2. Masukkan nama project: `smart-dispenser-sija` (atau nama unik lain seperti `smart-dispenser-ukl3-[nama-anda]`).
3. Klik tombol **Continue**.
4. Pada halaman *"Google Analytics for your Firebase project"*:
   - Untuk kebutuhan pengujian UKL sekolah, opsi Google Analytics boleh dimatikan (**Disable**) agar proses pembuatan project lebih cepat dan sederhana.
5. Klik **Create project**. Tunggu 10–20 detik hingga muncul pesan *"Your new project is ready"*.
6. Klik **Continue**. Anda akan diarahkan ke Dashboard Project Firebase Anda.

---

### Langkah 3: Membuat Realtime Database (RTDB)
1. Di bilah navigasi sebelah kiri, cari menu **Build** lalu klik **Realtime Database**.
2. Pada bagian tengah layar, klik tombol **Create Database**.
3. **Pilih Lokasi Database (Region)**:
   - Pada dropdown *Realtime Database location*, pilih: **`Singapore (asia-southeast1)`**.
   - *Mengapa Singapore?* Karena secara geografis paling dekat dengan Indonesia (Sidoarjo/Surabaya), sehingga memberikan latensi respons data paling cepat untuk ESP32.
4. Klik tombol **Next**.
5. **Pilih Mode Awal Keamanan**:
   - Pilih opsi **"Start in locked mode"**.
   - *Peringatan:* Jangan pernah memilih mode tes publik tanpa password pada sistem IoT yang mengendalikan perangkat fisik!
6. Klik **Enable**. Tunggu beberapa detik hingga database selesai dibuat.

---

### Langkah 4: Salin URL Realtime Database
1. Di bagian atas tampilan Realtime Database, Anda akan melihat tautan URL database dengan ikon rantai/tautan.
2. Format URL biasanya berupa:
   `https://[project-id]-default-rtdb.asia-southeast1.firebasedatabase.app/`
3. Klik tombol salin (**Copy**) di sebelah URL tersebut dan simpan di catatan Notepad sementara Anda. Ini adalah nilai `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.

---

### Langkah 5: Mendaftarkan Web App (Firebase Web Client)
1. Di panel navigasi kiri paling atas, klik ikon **Gerigi (Project settings)** di samping tulisan *"Project Overview"*.
2. Pada tab **General**, gulir ke bawah ke bagian **"Your apps"**.
3. Klik ikon web (**`</>`**).
4. Masukkan nama julukan aplikasi (*App nickname*), misalnya: `Smart Dispenser Web`.
5. Kosongkan tanda centang *"Also set up Firebase Hosting"*.
6. Klik tombol **Register app**.
7. Firebase akan menampilkan blok konfigurasi JavaScript:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "smart-dispenser-sija.firebaseapp.com",
     projectId: "smart-dispenser-sija",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "1:..."
   };
   ```
8. Salin nilai-nilai berikut untuk file `.env.local` Anda:
   - `apiKey` $\rightarrow$ `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` $\rightarrow$ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` $\rightarrow$ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `appId` $\rightarrow$ `NEXT_PUBLIC_FIREBASE_APP_ID`
9. Klik tombol **Continue to console**.

---

### Langkah 6: Membuat Kunci Rahasia Firebase Admin (Service Account)
Kunci ini digunakan oleh server backend Next.js untuk menulis dan memvalidasi perintah dari ESP32 secara aman:
1. Masih di halaman **Project Settings**, klik tab **"Service accounts"** di baris tab atas.
2. Pastikan pilihan berada pada *Firebase Admin SDK*.
3. Klik tombol **"Generate new private key"** (Buat kunci privat baru).
4. Kotak dialog konfirmasi akan muncul. Klik **Generate key**.
5. Browser Anda akan mengunduh sebuah file berformat `.json` (misalnya: `smart-dispenser-sija-firebase-adminsdk-xxxxx.json`).
6. Buka file JSON tersebut menggunakan Notepad atau VS Code. Anda akan melihat informasi:
   - `project_id`
   - `client_email`
   - `private_key` (berupa teks panjang yang diawali `-----BEGIN PRIVATE KEY-----\n...`)
7. **PENTING:** Jangan pernah mengunggah file JSON ini atau isi private key ke GitHub publik!

---

### Langkah 7: Menerapkan Database Security Rules
1. Kembali ke menu navigasi kiri: **Build** $\rightarrow$ **Realtime Database**.
2. Klik tab **Rules** di bagian atas.
3. Hapus aturan bawaan yang ada, lalu salin seluruh isi dari file proyek:
   `firebase/database.rules.json`
4. Tempel (*paste*) ke editor Rules Firebase Console.
5. Klik tombol **Publish** di pojok kanan atas.
6. Pesan hijau *"Rules published successfully"* akan muncul.

---

### Checklist Keberhasilan Tutorial 01
- [x] Project Firebase berhasil dibuat.
- [x] Realtime Database aktif di region `asia-southeast1`.
- [x] URL Realtime Database telah disalin.
- [x] Web App telah didaftarkan dan nilai Config telah disimpan.
- [x] File kunci privat Service Account JSON telah diunduh.
- [x] Database Rules telah dipublikasikan.

Lanjutkan ke: **[Tutorial 02: Menghubungkan Firebase ke Next.js](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/02-firebase-ke-nextjs.md)**.
