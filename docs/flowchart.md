# DIAGRAM ALIR SISTEM (SYSTEM FLOWCHART)
## Smart Dispenser IoT — SMK Telkom Sidoarjo (XII SIJA UKL 3)

### 1. Flowchart Loop Utama ESP32 & Interlock Keselamatan

```mermaid
flowchart TD
    Start([Mulai: ESP32 Boot]) --> InitHardware[Inisialisasi GPIO & Matikan Relay Pompa]
    InitHardware --> InitWifi[Hubungkan Wi-Fi 2.4 GHz]
    InitWifi --> BeepReady[Buzzer Beep Ready]
    
    BeepReady --> ReadSensors[Baca Seluruh Sensor: Ultrasonik Gelas, Tandon, ADC Baki, Pulsa Aliran]
    ReadSensors --> LocalAI[Jalankan Rule-Based AI Engine Secara Lokal]
    
    LocalAI --> CheckSafety{Kondisi Bahaya Terjadi?<br/>Gelas Diangkat / Baki Tumpah / Aliran Macet}
    CheckSafety -- YA --> EmergencyOff[Matikan Relay Pompa Seketika <br/>Bunyikan Buzzer Alarm]
    EmergencyOff --> LogViolation[Catat Pelanggaran Lokal <br/>Deduplikasi 5 Detik]
    LogViolation --> CheckWifi
    
    CheckSafety -- TIDAK --> CheckDispensing{Apakah Pompa Sedang Mengisi Air?}
    CheckDispensing -- YA --> CheckTarget{Target Volume Tercapai?}
    CheckTarget -- YA --> StopPumpNormal[Matikan Pompa Normal <br/>Bunyikan Beep Sukses]
    StopPumpNormal --> AckCommand[Kirim Acknowledgment COMPLETED ke Cloud]
    AckCommand --> CheckWifi
    CheckTarget -- TIDAK --> YieldLoop[Jeda 30 ms]
    
    CheckDispensing -- TIDAK --> CheckWifi{Wi-Fi Terhubung?}
    CheckWifi -- TIDAK --> ReconnectWifi[Coba Sambung Ulang Wi-Fi Background]
    ReconnectWifi --> YieldLoop
    
    CheckWifi -- YA --> CheckTimer{Waktunya Kirim Telemetri / Poll Perintah?}
    CheckTimer -- YA --> CloudSync[Kirim Telemetri ke Gateway <br/>Ambil Perintah PENDING]
    CloudSync --> YieldLoop
    CheckTimer -- TIDAK --> YieldLoop
    
    YieldLoop --> ReadSensors
```

---

### 2. Flowchart Siklus Perintah Dispensing dari Web

```mermaid
sequenceDiagram
    autonumber
    actor Siswa as Siswa / Pengguna
    participant Web as Web Dashboard (Next.js)
    participant API as Secure Next.js API Gateway
    participant Cloud as Firebase Realtime Database
    participant ESP as ESP32 Firmware

    Siswa->>Web: Pilih volume (misal: 200 ml) & Klik "Mulai Pengisian"
    Web->>API: POST /api/dispense/start (Sesi Siswa)
    API->>API: Validasi sesi siswa & cek parameter
    API->>Cloud: Tulis command: PENDING (expires_at: +45s)
    API-->>Web: Konfirmasi perintah dijadwalkan

    loop Polling Setiap 1.5 Detik (Saat Idle)
        ESP->>API: GET /api/device/commands (X-Device-Token)
        API->>Cloud: Cari command PENDING
        Cloud-->>API: Data perintah
        API-->>ESP: Return daftar perintah
    end

    ESP->>ESP: Cek Validasi Fisik:<br/>1. Gelas ada?<br/>2. Air tandon cukup?<br/>3. Baki kering?
    
    alt Jika Kondisi Tidak Aman
        ESP->>API: POST /api/device/ack (REJECTED + Alasan)
        API->>Cloud: Update status: REJECTED
        Cloud-->>Web: Web menampilkan pesan penolakan
    else Jika Kondisi Aman
        ESP->>API: POST /api/device/ack (ACKNOWLEDGED)
        API->>Cloud: Update status: RUNNING
        Cloud-->>Web: Web menampilkan pompa aktif
        ESP->>ESP: Hidupkan Relay & Mulai Hitung Pulsa Aliran
        
        loop Monitoring Pengisian
            ESP->>ESP: Ukur pulsa YF-S201 & Cek Keselamatan Lokal
        end
        
        ESP->>ESP: Target 200 ml tercapai -> Matikan Relay
        ESP->>API: POST /api/device/ack (COMPLETED, volume terukur: 200 ml)
        API->>Cloud: Simpan ke dispensingLogs & update status: COMPLETED
        Cloud-->>Web: Web menampilkan operasi selesai sukses!
    end
```
