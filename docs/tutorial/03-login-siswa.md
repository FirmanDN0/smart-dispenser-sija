# TUTORIAL 03: SETUP AKUN SISWA & LOGIN PIN
## Smart Dispenser IoT — Otentikasi Siswa Server-Side

Tutorial ini menjelaskan arsitektur otentikasi siswa menggunakan 4-digit PIN, cara kerja verifikasi hash di sisi server, serta pencegahan serangan tebak PIN (*brute-force*).

---

### 1. Mengapa Menggunakan 4-Digit PIN & Verifikasi Server-Side?
Di lingkungan sekolah atau laboratorium, siswa membutuhkan proses masuk yang cepat pada layar sentuh dispenser tanpa harus mengetik alamat email atau password yang panjang.
Namun, 4-digit PIN hanya memiliki 10.000 kombinasi (0000–9999). Jika verifikasi dilakukan di browser (client-side), peretas dapat membaca PIN atau mencoba seluruh kombinasi dalam hitungan detik.

Oleh karena itu, sistem ini menerapkan standar keamanan:
1. **Server-Side Verification**: PIN tidak pernah disimpan dalam bentuk teks biasa (plaintext), melainkan dalam bentuk hash kriptografi **SHA-256**.
2. **Rate Limiting & Lockout**: Jika seseorang salah memasukkan PIN sebanyak 5 kali berturut-turut, akun siswa tersebut otomatis dikunci selama **60 detik**.
3. **Session Cookie Kriptografis (HTTP-Only)**: Setelah PIN valid, server menerbitkan token sesi terenkripsi yang disimpan dalam cookie aman dan tidak dapat dibajak oleh script JavaScript perusak (XSS Protection).

---

### 2. Daftar Akun Siswa Pra-Konfigurasi (Data Uji Lab)

Sistem telah dilengkapi dengan data siswa kelas XII SIJA 2:

| ID Siswa | NIS | Nama Siswa | Kelas | Target Harian | PIN Default |
|---|---|---|---|---|---|
| `student_01` | `12022001` | Ahmad Fauzi | XII SIJA 2 | 1500 ml | **`1234`** |
| `student_02` | `12022002` | Bunga Citra | XII SIJA 2 | 1800 ml | **`1234`** |
| `student_03` | `12022003` | Dimas Pratama | XII SIJA 2 | 2000 ml | **`1234`** |
| `student_04` | `12022004` | Nabila Putri | XII SIJA 2 | 1600 ml | **`1234`** |
| `student_05` | `12022005` | Rizky Ramadhan | XII SIJA 2 | 2200 ml | **`1234`** |

*Catatan:* Hash SHA-256 dari PIN `1234` adalah:
`03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4`

---

### 3. Mengubah PIN Siswa (Opsi Administrator)
Jika Anda ingin mengubah PIN untuk siswa tertentu (misalnya `student_01` menjadi `5678`):
1. Buka terminal di VS Code, jalankan perintah Node.js untuk menghasilkan hash SHA-256 baru:
   ```bash
   node -e "console.log(require('crypto').createHash('sha256').update('5678').digest('hex'))"
   ```
2. Buka file `web/src/lib/constants.ts`.
3. Ganti nilai `pin_hash` pada siswa bersangkutan dengan hasil hash yang baru tersebut.
4. Simpan file.

---

### 4. Langkah Pengujian Login & Proteksi Lockout

1. Buka browser dan buka halaman login: **`http://localhost:3000/login`**.
2. **Uji Coba 1: Login Berhasil**:
   - Pilih nama **"Ahmad Fauzi"**.
   - Klik tombol angka pada keypad: `1`, `2`, `3`, `4`.
   - Klik tombol **"Masuk ke Sistem"**.
   - Halaman akan langsung beralih ke `/dashboard`, dan nama Ahmad Fauzi akan tampil di pojok kanan atas navbar beserta progres target hidrasinya.
3. **Uji Coba 2: Logout / Ganti Siswa**:
   - Klik tombol ikon pintu keluar (**Logout**) di sebelah nama siswa pada navbar.
   - Sistem akan menghapus cookie sesi dan mengembalikan Anda ke halaman login.
4. **Uji Coba 3: Proteksi Salah PIN & Penguncian Akun**:
   - Pilih nama **"Bunga Citra"**.
   - Masukkan PIN yang salah: `9999` lalu klik Masuk.
   - Sistem akan memunculkan peringatan merah: *"PIN yang Anda masukkan salah."*
   - Ulangi memasukkan PIN salah sebanyak 5 kali.
   - Pada percobaan kelima, sistem akan memunculkan peringatan penguncian:
     *"Akun terkunci sementara karena salah PIN berulang kali. Silakan coba lagi dalam 60 detik."*
   - Selama masa lockout, server akan menolak permintaan otentikasi akun tersebut meskipun kemudian dimasukkan PIN yang benar.

Lanjutkan ke: **[Tutorial 04: Flash MicroPython & Wi-Fi ESP32 via Thonny](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/04-esp32-wifi-thonny.md)**.
