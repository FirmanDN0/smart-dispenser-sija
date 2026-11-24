# TUTORIAL 08: KONTROL POMPA AIR DARI WEBSITE
## Smart Dispenser IoT — Siklus Perintah Cloud & Perilaku STOP

Tutorial ini menjelaskan secara mendalam bagaimana penekanan tombol di web diterjemahkan menjadi perintah fisik pada pompa air, siklus status perintah, serta penjelasan jujur mengenai latensi perintah STOP melalui jaringan internet.

---

### 1. Siklus Lengkap Perintah Dispensing (End-to-End Command Flow)

Alur kerja saat siswa meminta air minum melalui website:
```text
1. Siswa memilih 200 ml dan mengklik tombol "Mulai Pengisian"
          |
          v
2. Browser mengirim permintaan HTTP POST ke /api/dispense/start
   - Server memverifikasi sesi siswa (apakah sudah login valid?).
   - Server memeriksa bahwa volume berada di antara 20 - 500 ml.
          |
          v
3. Backend Next.js membuat perintah di Firebase:
   Path: /devices/dispenser01/commands/cmd_xxx
   Isi: {
     "action": "START_DISPENSE",
     "volume_ml": 200,
     "user_id": "student_01",
     "status": "PENDING",
     "expires_at": <waktu_sekarang + 45 detik>
   }
          |
          v
4. ESP32 sedang melakukan polling rutin (setiap 1.5 detik)
   - ESP32 mengambil daftar perintah berstatus "PENDING".
          |
          v
5. ESP32 MEMERIKSA KONDISI KESELAMATAN FISIK LOKAL:
   - Apakah cangkir terdeteksi? (Jika TIDAK -> Kirim status: REJECTED).
   - Apakah air tandon cukup? (Jika TIDAK -> Kirim status: REJECTED).
   - Apakah baki kering? (Jika BASAH -> Kirim status: REJECTED).
          |
          v
6. Jika kondisi aman:
   - ESP32 mengirim konfirmasi: ACKNOWLEDGED -> RUNNING.
   - ESP32 menyalakan relay (pompa berputar).
   - Passive buzzer membunyikan nada "start" pendek.
   - Sensor aliran air YF-S201 mulai menghitung pulsa.
          |
          v
7. Selama pengisian air:
   - MicroPython menghitung: volume_terukur = pulsa / 1.20
   - Jika target 200 ml tercapai:
     * Relay seketika dimatikan (OFF).
     * Buzzer membunyikan nada ceria sukses (dua nada naik).
     * ESP32 mengirim konfirmasi: COMPLETED ke /api/device/ack.
     * Backend menyimpan catatan riwayat ke /dispensingLogs.
```

---

### 2. Status Perintah (Command States) yang Didukung

Setiap perintah melewati siklus hidup yang terdefinisi dengan jelas:
- **`PENDING`**: Perintah baru saja dibuat oleh web, sedang menunggu diambil oleh ESP32.
- **`ACKNOWLEDGED`**: ESP32 telah menerima perintah dan sedang memvalidasi sensor fisik.
- **`RUNNING`**: Pompa air sedang aktif mengalirkan air ke dalam cangkir.
- **`COMPLETED`**: Target volume air telah terpenuhi dengan sempurna dan pompa telah dimatikan.
- **`REJECTED`**: Perintah ditolak oleh ESP32 karena kondisi fisik tidak aman (misalnya tidak ada cangkir atau air tandon kosong).
- **`FAILED`**: Perintah kedaluwarsa (*expired*) karena ESP32 offline, atau terjadi *timeout* pengisian air.

---

### 3. Penjelasan Jujur Mengenai Perilaku STOP & Latensi Jaringan

**PENTING UNTUK DIJELASKAN KEPADA GURU PENGUJI:**
Ketika Anda mengklik tombol **"STOP DARURAT"** di halaman web:
1. Permintaan harus berjalan melalui internet dari laptop Anda $\rightarrow$ ke server cloud $\rightarrow$ menunggu giliran polling ESP32 berikutnya ($\approx 1.0 - 1.5\text{ detik}$).
2. Oleh karena itu, **perintah STOP via cloud TIDAK BERSIFAT INSTAN** dan memiliki jeda latensi jaringan.
3. **Mekanisme Keselamatan Utama Berada di ESP32:**
   Jika terjadi keadaan darurat nyata (misalnya cangkir tersenggol atau air tumpah), **siswa cukup mengangkat cangkir atau menyentuh baki sensor**.
   Microcontroller ESP32 akan **memutus relay pompa dalam hitungan milidetik secara lokal**, tanpa bergantung sedikit pun pada koneksi Wi-Fi atau internet!

---

### 4. Langkah Pengujian Kontrol Pompa dari Web

1. Pasang selang pompa ke wadah penampung cangkir.
2. Pastikan tandon berisi air minimal 50%.
3. Letakkan cangkir tepat di bawah sensor ultrasonik cangkir (jarak $\le 10\text{ cm}$).
4. Buka halaman **Ambil Air** (`http://localhost:3000/dispense`).
5. Perhatikan kotak hijau *"Status Kesiapan Fisik (Safety Pre-Flight)"*:
   - Cangkir Terdeteksi: Hijau
   - Air Tandon Cukup: Hijau
   - Baki Kering: Hijau
   - Tombol *"Mulai Pengisian"* akan aktif berwarna biru.
6. Klik tombol **"Mulai Pengisian (200 ml)"**.
7. Lihat relay pompa pada rangkaian:
   - Lampu indikator relay akan menyala.
   - Pompa aktif mengalirkan air.
   - Bilah progres di website akan bergerak seiring pulsa yang dilaporkan oleh sensor YF-S201.
8. Saat air mencapai 200 ml, pompa mati otomatis, buzzer berbunyi ceria, dan catatan muncul di menu **Riwayat** (`/history`).

Lanjutkan ke: **[Tutorial 09: Deploy Next.js ke Vercel](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/09-deploy-vercel.md)**.
