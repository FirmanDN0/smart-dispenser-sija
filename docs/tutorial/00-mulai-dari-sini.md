# PANDUAN UTAMA: MULAI DARI SINI (MASTER SETUP GUIDE)
## Smart Dispenser IoT — SMK Telkom Sidoarjo (XII SIJA UKL 3)

Selamat datang di panduan instalasi dan integrasi menyeluruh **Smart Dispenser IoT**. Panduan ini dirancang khusus untuk siswa Kelas XII SIJA SMK Telkom Sidoarjo dalam rangka persiapan ujian UKL 3.

---

### 1. Prasyarat & Perangkat yang Dibutuhkan

Sebelum memulai, pastikan Anda telah menyiapkan:
1. **Perangkat Hardware**:
   - 1x ESP32 DevKit V1 (30 Pin)
   - 2x Sensor Ultrasonik HC-SR04
   - 1x Sensor Aliran Air Water Flow YF-S201
   - 1x Sensor Genangan Air Baki Tetesan (Analog Rain/Water Level Sensor)
   - 1x Modul Relay 5V 1-Channel (Active-Low)
   - 1x Pompa Air Submersible Mini 5V DC + Selang Silikon
   - 1x Passive Buzzer 5V
   - 1x Breadboard + Kabel Jumper (Male-to-Male, Male-to-Female)
   - Resistor $1\text{ k}\Omega$ dan $2\text{ k}\Omega$ (untuk pembagi tegangan pin ECHO)
   - Adaptor daya DC 5V 2A eksternal untuk pompa
   - Kabel data Micro-USB (pastikan kabel data, bukan hanya kabel charger)
2. **Perangkat Lunak di Laptop**:
   - Web Browser (Google Chrome / Mozilla Firefox)
   - Node.js (versi v18 atau v20+)
   - Thonny IDE (untuk memprogram ESP32 dengan MicroPython)
   - Visual Studio Code (VS Code)
   - Akun Google aktif (untuk mengakses Google Firebase Console)
   - Akun GitHub & Vercel (untuk deploy aplikasi web online)

---

### 2. Urutan Pengerjaan Tutorial (Langkah Demi Langkah)

Ikuti urutan tutorial ini secara berurutan tanpa melompat:

| Modul | Judul Tutorial | Estimasi Waktu | Deskripsi Singkat |
|---|---|---|---|
| **[Tutorial 01](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/01-membuat-firebase.md)** | Membuat Proyek Firebase dari Nol | 20 Menit | Pembuatan project Firebase, Realtime Database di region Asia Tenggara, dan aturan keamanan. |
| **[Tutorial 02](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/02-firebase-ke-nextjs.md)** | Menghubungkan Firebase ke Next.js | 15 Menit | Konfigurasi file `.env.local`, kredensial Admin SDK, dan verifikasi koneksi server. |
| **[Tutorial 03](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/03-login-siswa.md)** | Setup Akun Siswa & Login PIN | 15 Menit | Pemahaman otentikasi 4-digit PIN berbasis hash server-side dan proteksi lockout. |
| **[Tutorial 04](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/04-esp32-wifi-thonny.md)** | Flash MicroPython & Wi-Fi ESP32 | 25 Menit | Instalasi firmware MicroPython pada ESP32 menggunakan Thonny IDE dan uji sambung Wi-Fi. |
| **[Tutorial 05](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/05-esp32-ke-cloud.md)** | Menghubungkan ESP32 ke Cloud API | 20 Menit | Komunikasi HTTPS REST API antara ESP32 dan gateway Next.js dengan token rahasia perangkat. |
| **[Tutorial 06](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/06-ai-ke-sensor.md)** | Menghubungkan AI ke Sensor Nyata | 25 Menit | Cara kerja mesin AI lokal pada ESP32 dalam memproses 4 sensor fisik menjadi keputusan AMAN/BAHAYA. |
| **[Tutorial 07](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/07-realtime-dashboard.md)** | Menghubungkan Firebase ke Web | 15 Menit | Cara kerja listener WebSocket (onValue) yang memperbarui angka sensor di dashboard secara instan. |
| **[Tutorial 08](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/08-kontrol-pompa-dari-web.md)** | Kontrol Pompa Air dari Website | 20 Menit | Alur tombol "Ambil Air", pembuatan command cloud, polling ESP32, dan pemadaman darurat STOP. |
| **[Tutorial 09](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/09-deploy-vercel.md)** | Deploy Next.js ke Vercel | 20 Menit | Cara mempublikasikan website ke internet agar mendapatkan URL HTTPS publik untuk ESP32. |
| **[Tutorial 10](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/10-pengujian-akhir-ukl.md)** | Uji Coba Lengkap (Hari-H UKL) | 30 Menit | 24 skenario pengujian komprehensif di depan guru penguji (Bu Ike, Pak Indra, Bu Rizka). |
| **[Tutorial 11](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/11-kalibrasi-sensor.md)** | Kalibrasi Akurasi Sensor Fisik | 30 Menit | Langkah pengukuran gelas ukur untuk menghitung pulsa flow sensor dan batas tandon air tandon Anda. |

---

### 3. Dua Mode Operasi Sistem

1. **Mode Simulasi (Simulation Mode)**:
   - Digunakan saat Anda belum menghubungkan mikrokontroler fisik atau sedang menguji tampilan web di rumah.
   - Menggunakan data simulasi aman tanpa merusak data fisik riil.
   - Dapat diaktifkan melalui menu **Pengaturan** (`/settings`).
2. **Mode Perangkat Riil (Real Device Mode)**:
   - Digunakan saat ESP32 telah dinyalakan di laboratorium sekolah.
   - Seluruh data berasal dari pin sensor fisik GPIO ESP32 dan dikirimkan secara berkala ke Firebase.

Sekarang, buka **[Tutorial 01: Membuat Proyek Firebase dari Nol](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/01-membuat-firebase.md)** untuk memulai langkah pertama Anda!
