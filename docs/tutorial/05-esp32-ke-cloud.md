# TUTORIAL 05: MENGHUBUNGKAN ESP32 KE CLOUD API
## Smart Dispenser IoT — Komunikasi REST HTTPS & Token Keamanan

Tutorial ini menjelaskan arsitektur komunikasi antara ESP32 dan gateway Next.js, format payload JSON, serta cara menjalankan pengujian mandiri menggunakan file `test_cloud.py`.

---

### 1. Mengapa Menggunakan Gateway API Next.js?
Pada sistem IoT modern, mikrokontroler seperti ESP32 **tidak boleh menyimpan kunci privat Service Account Firebase Admin**. Kunci privat tersebut memiliki hak akses tak terbatas ke seluruh database dan proyek cloud Google Anda.

Sebagai gantinya, kita menggunakan arsitektur **Secure Next.js API Gateway**:
```text
ESP32 (Klien IoT)
   |
   | HTTPS REST Request (Header: X-Device-Token)
   v
Next.js API Gateway (/api/device/*)
   |
   | Server-Side Verification (SHA-256 Hash Check)
   v
Firebase Realtime Database (via Firebase Admin SDK)
```

**Keuntungan Arsitektur Ini:**
1. ESP32 hanya memegang sebuah token rahasia per-perangkat (`DEVICE_SECRET_TOKEN`).
2. Server Next.js memvalidasi token tersebut menggunakan perbandingan waktu-konstan (*constant-time comparison*) untuk mencegah serangan *timing attack*.
3. Jika token perangkat dicabut atau diganti, struktur internal database cloud tetap aman terlindungi.

---

### 2. Memahami Mengapa `localhost` Tidak Bisa Diakses ESP32
Banyak pemula melakukan kesalahan dengan memasukkan:
`API_BASE_URL = "http://localhost:3000"`

**Ingat:** Kata `localhost` berarti *"perangkat ini sendiri"*.
- Jika laptop Anda membuka `localhost:3000`, browser mengakses web server di laptop Anda.
- Jika **ESP32** mengakses `localhost:3000`, ESP32 berusaha menghubungi port 3000 di dalam microchip ESP32 itu sendiri—sehingga koneksi **PASTI GAGAL (Connection Refused)**!

**Solusi untuk Menghubungkan ESP32 ke Backend:**
- **Opsi A (Pengujian Lokal Satu Jaringan Wi-Fi)**:
  Gunakan alamat IP lokal laptop Anda di jaringan Wi-Fi sekolah/rumah (misalnya `http://192.168.1.50:3000`).
  *Cara cek IP laptop:* Buka Command Prompt di Windows, ketik `ipconfig`, lalu lihat baris *IPv4 Address*.
- **Opsi B (Produksi Online via Vercel - DIREKOMENDASIKAN)**:
  Gunakan domain HTTPS publik dari hasil deployment Vercel (misalnya `https://smart-dispenser-sija.vercel.app`), seperti yang dijelaskan pada Tutorial 09.

---

### 3. Endpoint API Gateway yang Wajib Diketahui

| Metode | Endpoint URL | Header Wajib | Deskripsi |
|---|---|---|---|
| `POST` | `/api/device/telemetry` | `X-Device-Token: <token>` | Mengirim data telemetri 4 sensor fisik dan hasil inferensi AI lokal ke cloud setiap 2.5 detik. |
| `GET` | `/api/device/commands?deviceId=dispenser01` | `X-Device-Token: <token>` | Melakukan polling apakah ada perintah pengisian air dari siswa di website. |
| `POST` | `/api/device/ack` | `X-Device-Token: <token>` | Mengonfirmasi status eksekusi perintah fisik (`ACKNOWLEDGED`, `RUNNING`, `COMPLETED`, `REJECTED`). |
| `POST` | `/api/device/events` | `X-Device-Token: <token>` | Melaporkan insiden pelanggaran keamanan fisik (seperti cangkir diangkat saat pompa menyala). |

---

### 4. Skema Payload Telemetri JSON
Format JSON yang dikirimkan oleh ESP32 ke `/api/device/telemetry`:
```json
{
  "deviceId": "dispenser01",
  "timestamp": 1732338000,
  "telemetry": {
    "cup_distance_cm": 6.8,
    "cup_detected": true,
    "reservoir_distance_cm": 5.2,
    "reservoir_percentage": 78.0,
    "tray_adc": 310,
    "spill_detected": false,
    "flow_pulses": 240,
    "measured_volume_ml": 200.0,
    "pump_running": false,
    "buzzer_active": false,
    "ai_classification": "AMAN",
    "ai_risk_level": "LOW",
    "ai_explanation": "Kondisi dispenser normal. Cangkir terpasang, level air mencukupi, baki kering.",
    "wifi_rssi": -58,
    "ip_address": "192.168.1.105"
  }
}
```

---

### 5. Menjalankan Uji Coba Diagnostik `test_cloud.py` di Thonny

Sebelum menjalankan program utama `main.py`, jalankan file uji mandiri `test_cloud.py`:
1. Buka aplikasi **Thonny IDE**.
2. Buka file **`test_cloud.py`** yang telah Anda unggah ke ESP32 pada Tutorial 04.
3. Klik tombol hijau **Run current script (F5)**.
4. Perhatikan output di Shell Thonny:
   ```text
   ============================================================
     DIAGNOSTIK KONEKSI CLOUD API — SMART DISPENSER IoT
     Target Gateway: https://smart-dispenser-sija.vercel.app
   ============================================================
   [1/3] Menghubungkan ke Wi-Fi...
   [WIFI] Terhubung! IP: 192.168.1.105, Gateway: 192.168.1.1
   [1/3] Wi-Fi berhasil terhubung!

   [2/3] Mengirim uji data telemetri simulasi ke server...
   HTTP Status: 200
   Response Server: {"success":true,"timestamp":1732338025120}
   [2/3] BERHASIL: Gateway menerima telemetri dan menulis ke Firebase!

   [3/3] Melakukan polling perintah ke GET /api/device/commands...
   HTTP Status: 200
   Response Server: {"deviceId":"dispenser01","commands":[],"timestamp":1732338026340}
   [3/3] BERHASIL: Endpoint polling perintah berfungsi normal!

   ============================================================
   DIAGNOSTIK SELESAI. Jika semua pengujian berstatus BERHASIL,
   ESP32 Anda siap menjalankan 'main.py' secara penuh.
   ============================================================
   ```
5. Buka Firebase Console di browser Anda:
   - Klik menu **Realtime Database** $\rightarrow$ tab **Data**.
   - Buka node `devices` $\rightarrow$ `dispenser01` $\rightarrow$ `telemetry` $\rightarrow$ `latest`.
   - Anda akan melihat data sensor yang baru saja dikirimkan oleh ESP32 tampil secara langsung di database Google!

Lanjutkan ke: **[Tutorial 06: Menghubungkan AI ke Sensor Nyata](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/06-ai-ke-sensor.md)**.
