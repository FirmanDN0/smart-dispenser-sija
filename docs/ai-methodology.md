# METODOLOGI KECERDASAN ARTIFISIAL (AI METHODOLOGY)
## Smart Dispenser IoT — SMK Telkom Sidoarjo (XII SIJA UKL 3)

### 1. Landasan Teori & Tinjauan Pustaka (Jurnal Acuan 2021–2026)

Proyek ini merujuk pada publikasi ilmiah bereputasi nasional dalam 5 tahun terakhir:
- **Judul Jurnal**: *Pengembangan Smart Water Dispenser Berbasis IoT Menggunakan Metode Prototype*
- **Penulis**: Muhamad Abdul Aziz, Muhamad Mahmud Rochani, Yusuf Eko R. (Universitas Boyolali)
- **Publikasi**: *Data Sciences Indonesia (DSI)*, Vol. 4 No. 1, 2024, Halaman 1–10.
- **Korelasi Terhadap Proyek SIJA**:
  Jurnal tersebut mengkaji otomatisasi pengisian air minum menggunakan mikrokontroler ESP32, sensor ultrasonik HC-SR04 untuk pengukuran level air, dan integrasi cloud Google Firebase untuk pemantauan realtime.
  Pada proyek UKL 3 ini, arsitektur dikembangkan lebih lanjut dengan menambahkan **Sensor Aliran Air Presisi YF-S201**, **Sensor Genangan Baki Tetesan (Spill Sensor)**, serta **Mesin Klasifikasi AI Lokal (Explainable Rule-Based Classifier)** yang berjalan mandiri pada firmware MicroPython ESP32.

---

### 2. Definisi Pendekatan AI (Explainable Rule-Based Classifier)

Sesuai dengan kriteria penilaian UKL 3 SMK Telkom Sidoarjo (minimal mengolah data sensor dengan kecerdasan buatan):
- Sistem ini mengimplementasikan **Explainable Rule-Based Decision Classifier** yang beroperasi secara deterministik dan transparan (*White-Box Model*).
- **Alasan Pemilihan Model**:
  Pada sistem dispensing fluida elektrik, keamanan fisik (*safety interlock*) menuntut latensi inferensi dalam orde milidetik (< 50 ms) tanpa toleransi terhadap *hallucination* atau ketidakpastian bobot stokastik jaringan saraf tiruan (*neural network*). Keputusan darurat (seperti cangkir dilepas saat pompa aktif) harus dapat diaudit dan memiliki bukti (*evidence*) eksplisit.

---

### 3. Vektor Fitur Masukan (Input Features)

Model menerima 9 fitur telemetri dari 4 sensor fisik dan status sistem:
1. `cup_distance_cm` (float): Jarak pantulan ultrasonik cangkir (cm).
2. `cup_detected` (bool): `True` jika jarak berada pada rentang valid $2.0 \text{ cm} \le x \le 10.0 \text{ cm}$.
3. `reservoir_distance_cm` (float): Jarak pantulan ultrasonik ke permukaan air tandon (cm).
4. `reservoir_percentage` (float): Persentase volume air tandon terkalibrasi (0.0% – 100.0%).
5. `tray_adc` (int): Nilai konversi analog-ke-digital dari sensor baki tetesan (0 – 4095).
6. `flow_pulses` (int): Jumlah akumulasi pulsa dari sensor aliran air YF-S201.
7. `pump_running` (bool): Status fisik relay pompa aktif (`True` / `False`).
8. `no_flow_duration_ms` (int): Durasi waktu tanpa pulsa saat pompa berstatus aktif (ms).
9. `sensor_validity` (bool): Integritas sinyal kabel dan rentang pembacaan sensor.

---

### 4. Kelas Keluaran (Output Classes) & Tingkat Risiko

| Kelas Target | Tingkat Risiko | Deskripsi Kondisi | Tindakan Sistem |
|---|---|---|---|
| **`AMAN`** | `LOW` | Cangkir terpasang, level tandon aman, baki kering, tidak ada kebocoran. | Sistem siap menerima perintah dispensing. |
| **`GELAS_TIDAK_ADA`** | `CRITICAL` (jika pompa aktif) / `LOW` (saat siaga) | Cangkir terangkat atau tidak terdeteksi pada dudukan. | Pompa seketika dimatikan jika aktif; siaga jika idle. |
| **`AIR_RENDAH`** | `MEDIUM` | Volume air tandon tersisa $\le 20\%$. | Fitur dispensing dinonaktifkan sementara; memunculkan notifikasi isi ulang tandon. |
| **`TUMPAHAN`** | `CRITICAL` | Baki tetesan basah atau tergenang air (`ADC >= 1200`). | Matikan pompa secara darurat; aktifkan buzzer alarm frekuensi tinggi. |
| **`ALIRAN_BERMASALAH`** | `HIGH` | Pompa menyala tetapi tidak ada pulsa aliran $> 2.5 \text{ detik}$. | Matikan relay pompa untuk mencegah kerusakan motor (*dry run*). |
| **`SENSOR_ERROR`** | `HIGH` | Nilai pembacaan di luar batas fisik ($<0 \text{ cm}$ atau $>200 \text{ cm}$). | Hentikan dispensing; beri indikasi periksa pengkabelan. |

---

### 5. Hierarki Keputusan & Bukti Keputusan (Decision Rules Hierarchy)

Algoritma dievaluasi dengan prioritas kaskade ketat:
```text
Prioritas 1: SENSOR_ERROR (Integritas sensor rusak)
       |--> False
Prioritas 2: TUMPAHAN (Genangan air baki tetesan)
       |--> False
Prioritas 3: GELAS_TIDAK_ADA saat Pompa Berjalan (Pelanggaran / Bahaya percikan)
       |--> False
Prioritas 4: ALIRAN_BERMASALAH (Pompa macet / selang tersumbat)
       |--> False
Prioritas 5: AIR_RENDAH (Tandon air kritis)
       |--> False
Prioritas 6: GELAS_TIDAK_ADA saat Siaga (Standby)
       |--> False
Prioritas 7: AMAN (Kondisi normal nominal)
```

---

### 6. Hasil Evaluasi & Metrik Pengujian Model

Berdasarkan eksekusi skrip evaluasi `ai/evaluation.py` terhadap dataset simulasi dan aktual:
- **Akurasi Keseluruhan (Overall Accuracy)**: **100.00%** (24/24 sampel)
- **Precision, Recall, F1-Score**: 100% pada seluruh 6 kelas target.
- **Transparansi Hasil**: Setiap keluaran menyertakan teks eksplanasi ilmiah dalam Bahasa Indonesia dan *sensor evidence snapshot* yang dikirimkan ke cloud Firebase untuk diverifikasi pada dashboard web.
