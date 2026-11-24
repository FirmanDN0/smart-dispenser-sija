# SMART DISPENSER IoT — SISTEM DISPENSER AIR PINTAR BERBASIS AI & CLOUD
## Uji Kenaikan Level 3 (UKL 3) — SMK Telkom Sidoarjo
### Jurusan Sistem Informatika, Jaringan, dan Aplikasi (SIJA) | Tahun Ajaran 2026/2027

---

### 📖 PANDUAN UTAMA MEMULAI
> **👉 UNTUK PEMULA / SISWA SIJA, SILAKAN BUKA PANDUAN UTAMA DI SINI:**
>
> 📘 **[PANDUAN LENGKAP: 00-MULAI-DARI-SINI.md](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/00-mulai-dari-sini.md)**

---

### Ringkasan Proyek
Smart Dispenser IoT adalah prototipe dispenser air minum otomatis berkeamanan tinggi yang mengintegrasikan mikrokontroler **ESP32 DevKit V1 (MicroPython)**, komputasi awan **Google Firebase Realtime Database**, gateway REST API aman **Next.js 15**, dan **Explainable Rule-Based Artificial Intelligence (AI)** untuk mendeteksi anomali fisik sensor (cangkir, tandon air, kebocoran/tumpahan baki, dan gangguan aliran pompa).

Proyek ini dirancang secara khusus untuk memenuhi seluruh kriteria penilaian ujian UKL 3 SMK Telkom Sidoarjo dengan dewan guru penguji: **Bu Ike**, **Pak Indra**, dan **Bu Rizka**.

---

### Daftar Modul Tutorial Langkah-demi-Langkah (Bahasa Indonesia)

1. **[Tutorial 01: Membuat Proyek Firebase dari Nol](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/01-membuat-firebase.md)**
2. **[Tutorial 02: Menghubungkan Firebase ke Next.js](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/02-firebase-ke-nextjs.md)**
3. **[Tutorial 03: Setup Akun Siswa & Login PIN](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/03-login-siswa.md)**
4. **[Tutorial 04: Flash MicroPython & Wi-Fi ESP32 via Thonny](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/04-esp32-wifi-thonny.md)**
5. **[Tutorial 05: Menghubungkan ESP32 ke Cloud API](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/05-esp32-ke-cloud.md)**
6. **[Tutorial 06: Menghubungkan AI ke Sensor Nyata](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/06-ai-ke-sensor.md)**
7. **[Tutorial 07: Menghubungkan Firebase ke Live Dashboard](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/07-realtime-dashboard.md)**
8. **[Tutorial 08: Kontrol Pompa Air dari Website](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/08-kontrol-pompa-dari-web.md)**
9. **[Tutorial 09: Deploy Next.js ke Vercel](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/09-deploy-vercel.md)**
10. **[Tutorial 10: Pengujian Akhir Komprehensif Hari-H UKL](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/10-pengujian-akhir-ukl.md)**
11. **[Tutorial 11: Kalibrasi Akurasi Sensor Fisik](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/11-kalibrasi-sensor.md)**

---

### Dokumentasi Arsitektur & Teknis
- 📐 **[Arsitektur Sistem IoT Cloud](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/architecture.md)**
- 🔄 **[Diagram Alir & Sequence Diagram](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/flowchart.md)**
- 🗄️ **[Entity Relationship Diagram (ERD) Basis Data](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/database-erd.md)**
- 🔌 **[Panduan Pinout & Pengkabelan Hardware](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/hardware-pinout.md)**
- 🧠 **[Metodologi AI & Rujukan Jurnal Ilmiah 2024](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/ai-methodology.md)**
- 📋 **[Checklist Penilaian UKL 3 Guru Penguji](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/ukl-checklist.md)**

---

### Alokasi Pinout Hardware (MANDATORI)

| Komponen | Pin Hardware | GPIO ESP32 | Keterangan |
|---|---|---|---|
| **HC-SR04 Cangkir** | TRIG | **GPIO 13** | Output Digital |
| **HC-SR04 Cangkir** | ECHO | **GPIO 14** | Input Digital (Pembagi Tegangan 5V ke 3.3V) |
| **HC-SR04 Tandon** | TRIG | **GPIO 16** | Output Digital |
| **HC-SR04 Tandon** | ECHO | **GPIO 17** | Input Digital (Pembagi Tegangan 5V ke 3.3V) |
| **YF-S201 Flow Sensor** | SIGNAL | **GPIO 27** | Input Interrupt Pulsa Aliran |
| **Modul Relay 5V** | IN | **GPIO 26** | Output Digital (Active-Low) |
| **Spill Sensor (Baki)** | S | **GPIO 34** | Input ADC Analog (0 – 4095) |
| **Passive Buzzer** | S / IN | **GPIO 25** | Output PWM Nada Akustik |

---

### Menjalankan Website Secara Mandiri (Lokal)
```bash
# 1. Pindah ke direktori web
cd web

# 2. Salin environment variable
cp .env.example .env.local

# 3. Jalankan server pengembangan
pnpm run dev
```
Buka browser pada alamat: **`http://localhost:3000`** atau panel diagnostik lab pada **`http://localhost:3000/setup`**.
