# CHECKLIST KELENGKAPAN UJI KENAIKAN LEVEL 3 (UKL 3)
## SMK Telkom Sidoarjo — Tahun Ajaran 2026/2027
### Kelas: XII SIJA (Sistem Informatika, Jaringan, dan Aplikasi)

**Tim Penguji:**
1. Bu Ike
2. Pak Indra
3. Bu Rizka

---

### 1. Rubrik Penilaian & Status Pemenuhan Proyek

| No | Kriteria Penilaian | Bobot | Bukti Implementasi Proyek | Status |
|---|---|---|---|---|
| **1** | **Implementasi IoT Hardware** | **25%** | • ESP32 DevKit V1 dengan MicroPython via Thonny.<br>• 4 Sensor: HC-SR04 Cangkir (GPIO 13/14), HC-SR04 Tandon (GPIO 16/17), YF-S201 Flow Sensor (GPIO 27), Analog Spill Sensor (GPIO 34).<br>• 3 Aktuator: Relay 5V (GPIO 26), Pompa Air Submersible 5V, Passive Buzzer PWM (GPIO 25).<br>• Rangkaian pembagi tegangan 5V ke 3.3V pada pin ECHO. | **LENGKAP** (100%) |
| **2** | **IoT Software & Firmware** | **25%** | • Modular MicroPython: `boot.py`, `main.py`, `sensors.py`, `flow_meter.py`, `relay_controller.py`, `pump_controller.py`, `buzzer.py`, `safety_controller.py`, `cloud_client.py`.<br>• Loop keselamatan non-blocking (interlock darurat < 50ms).<br>• Rekoneksi Wi-Fi otomatis. | **LENGKAP** (100%) |
| **3** | **Cloud / Database / API** | **15%** | • Firebase Realtime Database (`asia-southeast1`).<br>• Secure Next.js API Gateway (`/api/device/*`).<br>• Validasi token perangkat hardware via hash SHA-256.<br>• Security Rules JSON ketat (mencegah penulisan publik tanpa hak akses). | **LENGKAP** (100%) |
| **4** | **Aplikasi Web Monitoring** | **15%** | • Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS.<br>• Desain industri Antislop (Navy `#112D4E`, Blue `#2563EB`, White `#F8FAFC`).<br>• 8 Halaman Lengkap: `/login`, `/dashboard`, `/dispense`, `/monitoring`, `/ai-insights`, `/history`, `/leaderboard`, `/settings`, plus `/setup`.<br>• Responsif Desktop & Mobile. | **LENGKAP** (100%) |
| **5** | **Sistem Artificial Intelligence** | **20%** | • Explainable Rule-Based Sensor Classifier lokal pada ESP32.<br>• 6 Kelas Target: `AMAN`, `GELAS_TIDAK_ADA`, `AIR_RENDAH`, `TUMPAHAN`, `ALIRAN_BERMASALAH`, `SENSOR_ERROR`.<br>• Skrip evaluasi `ai/evaluation.py` & dataset CSV.<br>• Jurnal acuan ilmiah 2024 terindeks nasional. | **LENGKAP** (100%) |
| **TOTAL** | | **100%** | Seluruh kriteria buku panduan UKL 3 terpenuhi. | **SIAP UJI** |

---

### 2. Berkas & Lampiran Laporan UKL yang Tersedia

- [x] **Bab 1 - Pendahuluan**: Latar belakang mengacu pada jurnal ilmiah 2024 (*Aziz et al., Data Sciences Indonesia*).
- [x] **Bab 2 - Landasan Teori**: Teori sensor ultrasonik, efek Hall flow meter, mikrokontroler ESP32, Firebase RTDB, Next.js, dan Rule-Based AI.
- [x] **Bab 3 - Perancangan Sistem**:
  - [x] Arsitektur IoT Cloud (`docs/architecture.md`)
  - [x] Flowchart Sistem & Sequence Diagram (`docs/flowchart.md`)
  - [x] ERD Database Cloud (`docs/database-erd.md`)
  - [x] Wiring & Pinout Hardware (`docs/hardware-pinout.md`)
- [x] **Bab 4 - Implementasi**: Kode sumber firmware ESP32 lengkap dan aplikasi web.
- [x] **Bab 5 - Pengujian**: Skrip pengujian otomatis keamanan API dan evaluasi dataset AI.
- [x] **Bab 6 - Kesimpulan**: Analisis hasil pengujian dan catatan operasional alat.
- [x] **Tutorial Integrasi Mandiri**: 12 modul tutorial langkah-demi-langkah Bahasa Indonesia (`docs/tutorial/`).
