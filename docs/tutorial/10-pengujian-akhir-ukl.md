# TUTORIAL 10: PENGUJIAN AKHIR KOMPREHENSIF (HARI-H UKL)
## Smart Dispenser IoT — 24 Skenario Pengujian di Depan Penguji

Tutorial ini adalah panduan praktis bagi siswa saat mendemonstrasikan prototipe Smart Dispenser IoT di depan tim guru penguji UKL 3 SMK Telkom Sidoarjo (Bu Ike, Pak Indra, Bu Rizka).

---

### Daftar Periksa (Checklist) Sebelum Sesi Demo Dimulai

- [ ] Pastikan botol/tandon air telah terisi minimal 70% air bersih.
- [ ] Baki tetesan dalam kondisi kering dan bersih.
- [ ] Kabel adaptor pompa 5V tercolok ke stopkontak.
- [ ] ESP32 terhubung ke port USB dan lampu LED power menyala stabil.
- [ ] Hotspot Wi-Fi (2.4 GHz) aktif dan kuota internet mencukupi.
- [ ] Buka browser laptop pada halaman `/setup` untuk menunjukkan semua indikator hijau ke penguji.

---

### Skenario Pengujian 24 Langkah (Demonstrasi UKL 3)

| No | Tindakan Pengujian | Perilaku yang Diharapkan | Hasil Fisik & Indikator |
|---|---|---|---|
| **1** | Nyalakan ESP32 saat pertama kali boot | Relay pompa WAJIB mati (*default OFF*) | Pompa tidak berputar liar; buzzer berbunyi 1x tanda siap. |
| **2** | Periksa serial output Thonny | Muncul pesan koneksi Wi-Fi berhasil beserta IP | IP lokal tampil di shell Thonny. |
| **3** | Buka halaman `/setup` di website | Semua status environment & database tercentang | Kredensial Firebase & gateway valid. |
| **4** | Periksa waktu telemetri di `/monitoring` | Angka waktu berubah setiap 2.5 detik | Timestamp terus tersinkronisasi. |
| **5** | Uji tanpa cangkir pada dispenser | Status cangkir terbaca "KOSONG" | Sensor ultrasonik cangkir membaca jarak $>10\text{ cm}$. |
| **6** | Letakkan cangkir di bawah nozzle | Status cangkir seketika berubah "TERPASANG" | Jarak terbaca $5 - 8\text{ cm}$; indikator hijau menyala. |
| **7** | Buka halaman `/login` | Tampil pilihan siswa dan keypad PIN | Dropdown menampilkan siswa kelas XII SIJA. |
| **8** | Coba masukkan PIN salah 5x | Sistem mengunci akun siswa selama 60 detik | Muncul pesan proteksi lockout server-side. |
| **9** | Masukkan PIN benar (`1234`) | Berhasil masuk ke dashboard siswa | Nama siswa tampil di navbar beserta target harian. |
| **10** | Buka menu `/dispense` | Safety checklist mendeteksi cangkir siap | Tombol pengisian aktif berwarna biru. |
| **11** | Pilih takaran 100 ml lalu klik Mulai | Relay aktif, pompa menyala | Air mulai mengalir masuk ke dalam cangkir. |
| **12** | Amati pulsa sensor aliran YF-S201 | Angka pulsa bertambah di layar secara halus | Pulsa turbin terhitung akurat. |
| **13** | Tunggu air mencapai 100 ml | Pompa mati seketika pada takaran 100 ml | Buzzer berbunyi nada ceria tanda selesai. |
| **14** | Periksa menu `/history` | Tercatat 1 log baru dengan status COMPLETED | Volume 100 ml tercatat dengan durasi detik. |
| **15** | Periksa menu `/leaderboard` | Total konsumsi air siswa bertambah 100 ml | Progres target harian siswa meningkat. |
| **16** | **UJI KESELAMATAN 1: Angkat cangkir saat pengisian** | Pompa MATI SEKETIKA dalam < 50ms | Buzzer membunyikan alarm darurat; tidak ada air tumpah. |
| **17** | Periksa log pelanggaran | Tercatat insiden `CUP_REMOVED_DURING_FILL` | Akun siswa mendapat 1 poin penalti pelanggaran. |
| **18** | **UJI KESELAMATAN 2: Teteskan air ke baki sensor** | Pompa terkunci; AI mengeluarkan label `TUMPAHAN` | Banner merah darurat muncul di dashboard web. |
| **19** | Keringkan baki sensor dengan tisu | Status AI kembali normal ke `AMAN` | Banner kembali hijau; dispenser siap kembali. |
| **20** | **UJI KONDISI TANDON HABIS** | Tutup sensor tandon atau kuras air | AI mendeteksi `AIR_RENDAH` (Volume $\le 20\%$). |
| **21** | Coba klik Mulai Dispense saat tandon habis | Perintah ditolak (*REJECTED*) oleh ESP32 | Muncul pesan bahwa air tandon tidak mencukupi. |
| **22** | **UJI KETAHANAN OFFLINE: Matikan Wi-Fi Hotspot** | Interlock keselamatan lokal TETAP BEKERJA | ESP32 tetap mematikan pompa secara fisik walau internet mati. |
| **23** | Hidupkan kembali Wi-Fi Hotspot | ESP32 menyambung ulang otomatis (*auto-reconnect*) | Telemetri kembali mengalir ke cloud tanpa perlu reset manual. |
| **24** | Buka halaman `/ai-insights` | Tunjukkan pohon hierarki aturan AI | Jelaskan kepada penguji bahwa AI dapat dijelaskan (*Explainable AI*). |

---

### Tips Menghadapi Pertanyaan Penguji
- **Jika ditanya Bu Ike:** *"Apakah model AI ini menggunakan Neural Network?"*
  *Jawaban:* "Model ini menggunakan Explainable Rule-Based Sensor Classifier. Untuk sistem kendali fluida fisik, pendekatan deterministik berbasis aturan memiliki keunggulan latensi milidetik dan keandalan keselamatan mutlak (*zero hallucination*) sesuai landasan teori jurnal ilmiah 2024 (*Aziz et al.*)."
- **Jika ditanya Pak Indra:** *"Bagaimana jika koneksi internet terputus saat pompa sedang mengisi air?"*
  *Jawaban:* "Keselamatan pompa tidak bergantung pada cloud. Mikrokontroler ESP32 memiliki *hard local safety interlock* dan batas waktu maksimal (*hard timeout cutoff 25 detik*). Jika gelas diangkat atau sensor baki basah, relay langsung diputus oleh program lokal di ESP32 dalam hitungan milidetik."
- **Jika ditanya Bu Rizka:** *"Berapa kalibrasi pulsa per mililiter sensor alirannya?"*
  *Jawaban:* "Berdasarkan kalibrasi nyata di laboratorium dengan gelas ukur kimia 200 ml, nilai kalibrasi yang didapatkan adalah 1.20 pulsa per mililiter, bukan angka default teoritis 12 pulsa/ml yang sering keliru di internet."

Lanjutkan ke: **[Tutorial 11: Kalibrasi Akurasi Sensor Fisik](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/11-kalibrasi-sensor.md)**.
