# 08 — PANDUAN KOREKSI LAPORAN UKL 3 (BAB I - BAB VI & LAMPIRAN)
## Smart Dispenser IoT — SMK Telkom Sidoarjo (Kelas XII SIJA 2)

**Audit Date:** 2026-11-26  
**Auditor:** Senior IoT, Embedded Systems & Cloud Security Auditor  
**Tujuan:** Memberikan rujukan koreksi teks bab-per-bab untuk menyinkronkan laporan tertulis UKL 3 dengan kodingan implementasi nyata.

---

### BAB I — PENDAHULUAN

#### Koreksi 1.1: Klaim Model AI
* **Klaim Salah / Usang:** *"Sistem memanfaatkan kecerdasan buatan berbasis jaringan syaraf tiruan (Deep Learning) untuk memprediksi volume air."*
* **Implementasi Nyata:** Model yang digunakan adalah **Explainable Edge AI berbasis Sistem Pakar Aturan Hirarkis (*Rule-Based Expert System*)**, bukan Deep Learning.
* **Bukti Kode:** [firmware/ai_classifier.py#L5-L82](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L5-L82) dan [ai/model_config.json#L4](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/ai/model_config.json#L4).
* **Rekomendasi Paragraf Pengganti (Bahasa Indonesia Baku):**
  > *"Sistem Smart Dispenser IoT ini mengintegrasikan model Explainable Edge AI (SmartDispenser-RuleAI-v1) berbasis sistem inferensi aturan pakar berjenjang (Rule-Based Expert System). Pendekatan ini dipilih guna menjamin determinisme keselamatan fisik secara seketika pada mikrokontroler ESP32 tanpa ketergantungan komputasi awan, sekaligus menyediakan transparansi penalaran diagnostik (Explainable AI) atas setiap status risiko yang terdeteksi."*

---

### BAB II — LANDASAN TEORI

#### Koreksi 2.1: Karakteristik Sensor Aliran Air YF-S201
* **Klaim Salah / Usang:** *"Sensor YF-S201 secara otomatis menghasilkan pulsa dengan konstanta tetap 450 pulsa per liter sesuai rumus standar pabrikan."*
* **Implementasi Nyata:** Rumus standar pabrikan ($F = 7.5 \times Q$) hanya berlaku untuk debit deras ($1 - 30\text{ L/min}$). Pada debit pompa mini DC ($0.2 - 0.4\text{ L/min}$), turbin mengalami non-linearitas dan memerlukan kalibrasi empiris menjadi **$15.0\text{ pulsa/ml}$ ($15.000\text{ pulsa/Liter}$)**.
* **Bukti Kode:** [firmware/config.py#L41](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L41).
* **Rekomendasi Paragraf Pengganti:**
  > *"Secara teoritis, lembar data sensor YF-S201 menetapkan hubungan frekuensi pulsa terhadap debit air melalui persamaan $F = 7.5 \times Q$. Namun, pengujian laboratorium menunjukkan bahwa pada laju aliran rendah yang dihasilkan oleh pompa mini DC, karakteristik hidrodinamika fluida berada di luar kurva linear pabrikan. Oleh karena itu, dilakukan kalibrasi empiris khusus pada firmware MicroPython dengan menetapkan konstanta $15.0\text{ pulsa/ml}$ untuk menjamin ketepatan takaran volume."*

---

### BAB III — ANALISIS DAN PERANCANGAN SISTEM

#### Koreksi 3.1: Diagram Relasi Entitas (ERD) vs. NoSQL Firebase
* **Klaim Salah / Usang:** *"Perancangan basis data menggunakan pemodelan Relational Database (ERD) dengan tabel relasional Siswa, Dispenser, Telemetri, dan Transaksi."*
* **Implementasi Nyata:** Backend menggunakan **Google Firebase Realtime Database (NoSQL JSON Tree)**, bukan basis data relasional SQL. Data telemetri hanya menyimpan kondisi terakhir (`latest`), sedangkan riwayat transaksi dicatat pada simpul `/dispensingLogs`.
* **Bukti Kode:** [web/src/app/api/device/telemetry/route.ts#L106-L120](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/device/telemetry/route.ts#L106-L120).
* **Rekomendasi Paragraf Pengganti:**
  > *"Arsitektur basis data dirancang menggunakan paradigma NoSQL berorientasi dokumen JSON melalui Google Firebase Realtime Database. Skema data disusun secara hierarkis mencakup simpul telemetri terkini (`/devices/dispenser01/telemetry/latest`), antrean kendali (`/devices/dispenser01/commands`), serta log historis transaksi pengeluaran air (`/dispensingLogs`). Struktur ini mengeliminasi kebutuhan tabel relasional dan memaksimalkan efisiensi sinkronisasi WebSocket ke peramban web."*

#### Koreksi 3.2: Otoritas Keselamatan Fisik (Local Safety Authority)
* **Klaim Salah / Usang:** *"Pompa air dikendalikan sepenuhnya oleh server cloud Vercel."*
* **Implementasi Nyata:** ESP32 bertindak sebagai **Local Safety Authority**. Keputusan penghentian darurat dieksekusi secara lokal di ESP32 dalam siklus $\le 30\text{ ms}$ tanpa menunggu perintah dari server cloud.
* **Bukti Kode:** [firmware/safety_controller.py#L21-L70](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/safety_controller.py#L21-L70).

---

### BAB IV — IMPLEMENTASI SISTEM

#### Koreksi 4.1: Algoritma Kompensasi Inersia Fluida (Cutoff Offset)
* **Klaim Salah / Usang:** *"Relay pompa dimatikan tepat ketika volume terhitung sama dengan volume target yang diminta siswa."*
* **Implementasi Nyata:** Firmware mematikan relay **$5.0\text{ ml}$ lebih awal** (`FLOW_CUTOFF_OFFSET_ML = 5.0`) untuk mengompensasi sisa inersia dorongan air di selang.
* **Bukti Kode:** [firmware/config.py#L45](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L45) dan [firmware/pump_controller.py#L77-L80](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/pump_controller.py#L77-L80).
* **Rekomendasi Paragraf Pengganti:**
  > *"Dalam implementasi aktuasi pompa, diterapkan algoritma kompensasi inersia fluida (Cutoff Lead Offset). Apabila pompa dimatikan tepat saat volume target tercapai, momentum kinetik cairan di sepanjang selang akan menyebabkan kelebihan volume (overshoot) sebesar 3–6 ml di dalam gelas. Firmware mengatasi hal ini dengan memutus daya relay 5.0 ml sebelum target tercapai, sehingga kucuran sisa cairan secara presisi menggenapkan volume air hingga tepat 100%."*

#### Koreksi 4.2: Keamanan Otentikasi Perangkat Hardware
* **Klaim Salah / Usang:** *"Pengiriman data sensor dari ESP32 dilakukan secara terbuka tanpa otentikasi."*
* **Implementasi Nyata:** ESP32 mengirim token rahasia pada header `X-Device-Token`, yang diverifikasi di server Next.js melalui hash **SHA-256** menggunakan fungsi waktu konstan **`crypto.timingSafeEqual`**.
* **Bukti Kode:** [web/src/lib/device-auth.ts#L9-L38](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/lib/device-auth.ts#L9-L38).

---

### BAB V — PENGUJIAN DAN ANALISIS HASIL

#### Koreksi 5.1: Tabel Hasil Pengujian Presisi Pengisian
* **Rekomendasi Pembaruan Data Pengujian:**  
  Pastikan tabel pengujian volume di laporan mencantumkan kolom:
  1. *Volume Diminta (Target ml)*
  2. *Pulsa Terhitung di Sensor*
  3. *Volume Terhitung di Firmware (ml)*
  4. *Volume Fisik Aktual di Gelas Ukur (ml)*
  5. *Persentase Galat / Error (%)*

Contoh format tabel baku:
| Percobaan | Target Volume | Pulsa Sensor | Volume Firmware | Volume Fisik Aktual | Deviasi / Galat (%) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | $50\text{ ml}$ | 682 pulsa | $45.4\text{ ml}$ | $50.0\text{ ml}$ | $0.0\%$ |
| 2 | $100\text{ ml}$ | 1430 pulsa | $95.3\text{ ml}$ | $101.5\text{ ml}$ | $+1.5\%$ |
| 3 | $200\text{ ml}$ | 2910 pulsa | $194.0\text{ ml}$ | $198.0\text{ ml}$ | $-1.0\%$ |

---

### BAB VI — PENUTUP & SARAN

#### Rekomendasi Saran Pengembangan Lanjutan untuk Laporan:
1. **Penerapan Rangkaian Snubber / Optocoupler:** Menambahkan isolasi optik pada pin interupsi GPIO 27 untuk meredam gangguan derau elektromagnetik (*inductive kickback*) dari motor DC.
2. **Penggunaan Katup Solenoid Anti-Tetes (*Solenoid Valve*):** Menambahkan katup solenoid berkecepatan tinggi di ujung nosel dispenser untuk menghentikan aliran air secara mekanis tanpa mengandalkan efek gravitasi.
3. **Penyimpanan Telemetri Berkala (*Time-Series Logging*):** Mengembangkan pencatatan histori tren ketinggian tandon berbasis waktu menggunakan Firebase Firestore atau InfluxDB.

---

### LAMPIRAN

* Lampirkan listing kode resmi dari file:
  1. [firmware/config.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py)
  2. [firmware/safety_controller.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/safety_controller.py)
  3. [firmware/ai_classifier.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py)
  4. [web/src/lib/device-auth.ts](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/lib/device-auth.ts)
* Seluruh nilai rahasia (`FIREBASE_ADMIN_PRIVATE_KEY`, token perangkat) wajib disamarkan menjadi **`[REDACTED]`** demi keamanan data.
