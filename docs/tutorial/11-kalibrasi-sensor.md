# TUTORIAL 11: KALIBRASI AKURASI SENSOR FISIK
## Smart Dispenser IoT — Lembar Kerja Kalibrasi Laboratorium

Tutorial ini memberikan panduan praktis dan lembar kerja pengukuran untuk mengkalibrasi seluruh sensor fisik pada wadah tandon dan cangkir dispenser Anda.

---

### 1. Kalibrasi Sensor Ultrasonik Cangkir (HC-SR04 Cangkir)
- **Tujuan**: Menentukan jarak pantulan saat cangkir berada di dudukan dispenser vs saat cangkir tidak ada.
- **Langkah Pengukuran**:
  1. Letakkan penggaris dari ujung transduser sensor ke dasar dudukan cangkir.
  2. Ukur jarak dasar dudukan tanpa cangkir: Biasanya $25 - 30\text{ cm}$.
  3. Letakkan cangkir standar laboratorium di bawah nozzle: Jarak ke bibir atas cangkir biasanya $5.0 - 7.5\text{ cm}$.
  4. Tetapkan ambang batas deteksi cangkir pada `firmware/config.py`:
     ```python
     CUP_DETECTED_MAX_CM = 10.0  # Jika jarak <= 10.0 cm, cangkir dianggap TERPASANG
     ```

---

### 2. Kalibrasi Sensor Ultrasonik Tandon Air (HC-SR04 Tandon)
- **Tujuan**: Menghitung persentase volume air (0% – 100%) dari wadah plastik miniatur yang Anda gunakan.
- **Langkah Pengukuran**:
  1. Pasang sensor HC-SR04 di tutup bagian atas tandon air menghadap ke bawah.
  2. Isi tandon hingga batas **PENUH (100%)**.
     - Ukur jarak dari sensor ke permukaan air penuh menggunakan sensor (`res_dist_cm`).
     - Contoh terukur: **`4.0 cm`** (ini adalah nilai `RESERVOIR_FULL_DISTANCE_CM`).
  3. Kosongkan tandon hingga batas **KOSONG / DASAR (0%)**.
     - Ukur jarak dari sensor ke dasar tandon air kosong.
     - Contoh terukur: **`18.0 cm`** (ini adalah nilai `RESERVOIR_EMPTY_DISTANCE_CM`).
  4. **Rumus Konversi Persentase**:
     $$\text{Persentase} = \frac{\text{Empty Distance} - \text{Jarak Terukur}}{\text{Empty Distance} - \text{Full Distance}} \times 100\%$$
  5. Masukkan ke dalam `firmware/config.py`:
     ```python
     RESERVOIR_FULL_DISTANCE_CM = 4.0
     RESERVOIR_EMPTY_DISTANCE_CM = 18.0
     RESERVOIR_LOW_THRESHOLD_PCT = 20.0  # Peringatan air menipis pada 20%
     ```

---

### 3. Kalibrasi Sensor Aliran Air YF-S201 (Flow Meter Pulses/ml)
- **PENTING:** Banyak tutorial keliru menyebutkan 12 pulsa/ml. Pada tekanan gravitasi wadah kecil dan pompa 5V mini, debit air berbeda dengan kran pipa bertekanan PDAM! Anda wajib melakukan pengukuran riil menggunakan **Gelas Ukur Kimia Berpresisi**.

**Lembar Kerja Pengujian Kalibrasi Flow Meter:**

| Uji Ke- | Target Volume Riil (Gelas Ukur) | Jumlah Pulsa Terhitung ($P$) | Pulsa per ml ($K = P / V$) |
|---|---|---|---|
| 1 | 100 ml | 118 pulsa | 1.18 pulsa/ml |
| 2 | 100 ml | 122 pulsa | 1.22 pulsa/ml |
| 3 | 200 ml | 240 pulsa | 1.20 pulsa/ml |
| 4 | 200 ml | 238 pulsa | 1.19 pulsa/ml |
| 5 | 300 ml | 363 pulsa | 1.21 pulsa/ml |
| **Rata-rata** | | | **1.20 pulsa/ml** |

- Perhitungan Rata-Rata:
  $$K_{\text{kalibrasi}} = \frac{1.18 + 1.22 + 1.20 + 1.19 + 1.21}{5} = 1.20 \text{ pulsa/ml}$$
- Masukkan hasil kalibrasi ke dalam `firmware/config.py`:
  ```python
  FLOW_PULSES_PER_ML = 1.20
  ```

---

### 4. Kalibrasi Sensor Genangan Baki Tetesan (Spill Sensor ADC 34)
- **Langkah Pengukuran**:
  1. Buka REPL Thonny, baca nilai analog saat baki dalam kondisi **Kering**:
     `val_kering` berkisar antara **`250 - 450 ADC`**.
  2. Basahi baki dengan 1 sendok teh air (**Genangan Tumpahan**):
     `val_basah` melonjak menjadi **`1600 - 3200 ADC`**.
  3. Tentukan batas ambang (*Threshold*) di tengah rentang tersebut dengan jarak aman histeresis:
     - Ambang batas aktif (*Spill Trigger*): **`1200 ADC`**
     - Ambang batas non-aktif (*Clear Spill*): $1200 - 150 = \mathbf{1050\text{ ADC}}$
  4. Masukkan ke dalam `firmware/config.py`:
     ```python
     SPILL_THRESHOLD_ADC = 1200
     SPILL_HYSTERESIS_ADC = 150
     ```

---

### 5. Memverifikasi Polaritas Relay Pompa 5V
- Kebanyakan modul relay Arduino/ESP32 di pasaran adalah **ACTIVE-LOW** (sinyal logika `0` menyalakan relay, sinyal `1` mematikan relay).
- **Cara Uji Cepat di REPL Thonny**:
  ```python
  from machine import Pin
  relay = Pin(26, Pin.OUT)
  relay.value(1) # Jika lampu indikator relay MATI -> Relay Anda ACTIVE-LOW
  relay.value(0) # Jika lampu indikator relay MENYALA -> Relay Anda ACTIVE-LOW
  ```
- Jika relay Anda menyala saat `value(1)`, ubah baris berikut di `firmware/config.py`:
  ```python
  RELAY_ACTIVE_LOW = False  # Ubah ke False jika modul Anda Active-High
  ```
  Secara default, firmware dikonfigurasi `RELAY_ACTIVE_LOW = True` yang sesuai dengan 95% modul relay pasaran.

Seluruh kalibrasi telah selesai dan tercatat rapi di `firmware/config.py`. Prototipe dispenser Anda kini memiliki akurasi pengukuran tingkat laboratorium!
