# TUTORIAL 06: MENGHUBUNGKAN AI KE SENSOR NYATA
## Smart Dispenser IoT — Logika Klasifikasi AI Lokal & Bukti Sensor

Tutorial ini menjelaskan bagaimana pembacaan fisik dari 4 sensor diolah oleh modul MicroPython `ai_classifier.py` di dalam ESP32 untuk menghasilkan keputusan yang dapat dijelaskan (*Explainable AI*).

---

### 1. Memahami Alur Sensor Menjadi Keputusan AI

Alur data sensor berjalan di dalam microchip ESP32 setiap 30 milidetik:
```text
1. Sensor Fisik Membaca Nilai Riil
   - HC-SR04 Cangkir      --> Mengukur durasi pantulan pulsa suara (cm)
   - HC-SR04 Tandon       --> Mengukur jarak permukaan air ke sensor (cm)
   - Sensor Baki (ADC 34) --> Mengukur konduktivitas listrik air (0 - 4095 ADC)
   - Flow Sensor (GPIO 27)--> Menghitung pulsa putaran turbin magnetik (pulses)
          |
          v
2. Struktur Data Snapshot
   Dikemas ke dalam dictionary Python dengan 9 parameter operasional.
          |
          v
3. Mesin Klasifikasi AI Lokal (ai_classifier.py)
   Mengevaluasi hierarki aturan deterministik transparan.
          |
          v
4. Keputusan & Tindakan Sistem
   - Jika AMAN      --> Lampu hijau, sistem siap menerima pesanan air.
   - Jika TUMPAHAN  --> Relay pompa dimatikan < 50ms, alarm buzzer berbunyi, catat insiden.
   - Jika AIR RENDAH--> Kunci tombol pengisian, tampilkan instruksi isi ulang tandon.
```

---

### 2. Menguji Skenario Bahaya 1: Tumpahan Air pada Baki (TUMPAHAN)

**Langkah Pengujian Fisik:**
1. Pastikan ESP32 sedang menyala dan menjalankan `main.py`.
2. Buka dashboard web di laptop Anda pada menu **Pemantauan Sensor** (`/monitoring`).
3. Teteskan beberapa tetes air (atau sentuhkan jari basah) pada jalur tembaga sensor baki tetesan (GPIO 34).
4. **Hasil yang Terjadi**:
   - Nilai ADC pada sensor baki seketika melonjak dari $\approx 310$ menjadi $> 1200$.
   - Modul `ai_classifier.py` secara instan mengeluarkan label: **`TUMPAHAN`** dengan risiko **`CRITICAL`**.
   - Jika pompa sedang menyala, relay akan diputus seketika oleh `safety_controller.py`.
   - Passive buzzer pada GPIO 25 akan membunyikan nada alarm darurat frekuensi tinggi.
   - Dashboard web seketika memunculkan banner merah darurat:
     *"DARURAT: TUMPAHAN AIR TERDETEKSI (AI RISK: CRITICAL) - Baki tetesan mendeteksi genangan air."*
5. Keringkan sensor menggunakan tisu kering. Nilai ADC akan kembali turun di bawah ambang batas histeresis ($< 1050$), buzzer berhenti, dan status kembali ke **`AMAN`**.

---

### 3. Menguji Skenario Bahaya 2: Gelas Diangkat Saat Pengisian (Pelanggaran Siswa)

**Langkah Pengujian Fisik:**
1. Letakkan cangkir pada dispenser di bawah nozzle (jarak sensor $\le 10\text{ cm}$).
2. Buka halaman **Ambil Air** (`/dispense`) di website, pilih takaran `200 ml`, lalu klik **Mulai Pengisian**.
3. Pompa akan menyala dan air mulai mengalir ke dalam cangkir.
4. **Saat air sedang mengalir, angkat cangkir secara tiba-tiba!**
5. **Hasil yang Terjadi**:
   - Sensor ultrasonik cangkir mendeteksi lonjakan jarak menjadi $> 20\text{ cm}$ (`cup_detected = False`).
   - Mesin keselamatan fisik lokal (`safety_controller.py`) **seketika mematikan relay pompa dalam waktu kurang dari 50 milidetik**, sebelum air tumpah mengotori meja!
   - Modul AI mengklasifikasikan status sebagai **`GELAS_TIDAK_ADA`** dengan risiko **`CRITICAL`**.
   - Sistem merekam 1 insiden pelanggaran ke dalam node `violationEvents` di Firebase dengan tipe `CUP_REMOVED_DURING_FILL`.
   - Modul `event_logger.py` memastikan bahwa insiden tersebut **hanya dicatat 1 kali** (mencegah duplikasi data insiden akibat perulangan loop).
   - Di halaman **Leaderboard** (`/leaderboard`), akun siswa Anda akan mendapatkan penalti 1 poin pelanggaran.

---

### 4. Menguji Skrip Evaluasi Model AI (`ai/evaluation.py`)
Untuk kebutuhan laporan dan presentasi di depan guru penguji, Anda dapat menunjukkan hasil evaluasi metrik AI:
1. Buka terminal di laptop Anda pada root project:
   ```bash
   python ai/evaluation.py
   ```
2. Terminal akan menampilkan matriks konfusi (*Confusion Matrix*) dan metrik ilmiah:
   ```text
   === EVALUASI MODEL AI SMART DISPENSER ===
   Dataset: ai/dataset_simulated.csv
   Jumlah sampel: 24
   =============================================

   --- CONFUSION MATRIX ---
   Actual \ Predicted                AMAN   GELAS_TIDAK_ADA        AIR_RENDAH ...
   AMAN                                 6                 0                 0 ...
   GELAS_TIDAK_ADA                      0                 4                 0 ...
   ...
   Overall Accuracy: 100.00% (24/24)
   =============================================
   ```
3. Cetak atau tangkap layar (*screenshot*) hasil evaluasi ini untuk dilampirkan pada **Bab 5 Laporan UKL**.

Lanjutkan ke: **[Tutorial 07: Menghubungkan Firebase ke Live Dashboard](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/07-realtime-dashboard.md)**.
