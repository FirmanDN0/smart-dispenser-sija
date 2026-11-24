# TUTORIAL 04: FLASH MICROPYTHON & WI-FI ESP32 VIA THONNY
## Smart Dispenser IoT — Persiapan Firmware Mikrokontroler

Tutorial ini menjelaskan cara menginstal Thonny IDE, melakukan flashing firmware MicroPython ke ESP32 DevKit V1, mengonfigurasi Wi-Fi sekolah, dan menjalankan REPL Python.

---

### Langkah 1: Mengunduh dan Menginstal Thonny IDE
1. Buka browser dan kunjungi situs resmi Thonny: **`https://thonny.org/`**
2. Unduh installer untuk Windows (tersedia di kotak kanan atas bertuliskan *"Windows"*).
3. Jalankan file installer `.exe` yang telah diunduh, ikuti instruksi default (*Next $\rightarrow$ Install*).
4. Buka aplikasi **Thonny** dari Start Menu Windows Anda.

---

### Langkah 2: Mengunduh Firmware MicroPython ESP32
1. Buka tautan resmi download firmware MicroPython:
   **`https://micropython.org/download/esp32/`**
2. Cari bagian **"Releases"** dan unduh file firmware `.bin` stabil terbaru (misalnya: `ESP32_GENERIC-20240222-v1.22.2.bin`).
3. Simpan file `.bin` tersebut di folder yang mudah ditemukan (misalnya folder `Downloads` atau `Desktop`).

---

### Langkah 3: Menghubungkan ESP32 ke Laptop
1. Ambil ESP32 DevKit V1 Anda.
2. Hubungkan ke port USB laptop menggunakan **kabel data Micro-USB**.
   - *Penting:* Lampu LED merah (Power) pada board ESP32 akan menyala. Jika lampu tidak menyala sama sekali, coba ganti port USB atau ganti kabel Micro-USB Anda.
3. Di Windows, buka **Device Manager** $\rightarrow$ periksa bagian **Ports (COM & LPT)**.
   - Anda akan melihat port terdeteksi, misalnya: `Silicon Labs CP210x USB to UART Bridge (COM3)` atau `USB-SERIAL CH340 (COM4)`.
   - Catat nomor COM tersebut (contoh: `COM3`).

---

### Langkah 4: Flashing Firmware MicroPython ke ESP32
1. Di dalam aplikasi **Thonny**, klik menu: **Tools** $\rightarrow$ **Options...**
2. Klik tab **Interpreter**.
3. Pada dropdown pertama (*Which kind of interpreter should Thonny use?*), pilih:
   **`MicroPython (ESP32)`**
4. Pada dropdown port (*Port or WebREPL*), pilih port COM yang sesuai (contoh: `COM3`).
5. Di pojok kanan bawah jendela Options, klik tautan bertuliskan:
   **`Install or update MicroPython (esptool)`**
6. Pada jendela installer yang muncul:
   - **Target port**: Pilih port COM Anda (misal `COM3`).
   - **MicroPython family**: Pilih `ESP32 / WROOM`.
   - **MicroPython variant**: Pilih `Espressif • ESP32`.
   - **Firmware file**: Klik tombol Browse (`...`) lalu pilih file `.bin` yang telah Anda unduh pada Langkah 2.
   - Beri tanda centang pada opsi: **"Erase flash before installing"** (membersihkan memori flash lama).
7. Klik tombol **Install**.
   - *Tips:* Jika muncul pesan *"Connecting..."* terus-menerus dan gagal, **tekan dan tahan tombol BOOT** pada board ESP32 selama 2 detik saat proses koneksi dimulai.
8. Tunggu hingga proses selesai (*Done!*), lalu klik **Close** dan klik **OK**.

---

### Langkah 5: Memverifikasi Python REPL
1. Lihat panel bawah di Thonny bertuliskan **Shell**.
2. Anda akan melihat prompt interaktif MicroPython:
   ```text
   MicroPython v1.22.2 on 2024-02-22; ESP32 module with ESP32
   Type "help()" for more information.
   >>> 
   ```
3. Ketik perintah uji coba sederhana:
   ```python
   >>> print("Halo SIJA SMK Telkom!")
   ```
   Tekan Enter. Jika teks muncul kembali, MicroPython telah bekerja sempurna pada ESP32 Anda!

---

### Langkah 6: Membuat File `secrets.py` pada ESP32
1. Di VS Code atau Thonny, buka file template: `firmware/secrets.example.py`.
2. Simpan file tersebut dengan nama **`secrets.py`** di dalam folder `firmware/`.
3. Isi SSID dan Password Wi-Fi yang tersedia di laboratorium Anda:
   ```python
   # secrets.py
   WIFI_SSID = "LAB_SIJA_24G"       # Wajib frekuensi 2.4 GHz!
   WIFI_PASSWORD = "PasswordWifiLab"
   API_BASE_URL = "http://192.168.1.50:3000"  # Ganti dengan IP laptop Anda atau URL Vercel
   DEVICE_SECRET_TOKEN = "sija_dispenser_super_secret_token_2026"
   ```
   *Catatan Penting Wi-Fi:* ESP32 **hanya mendukung Wi-Fi frekuensi 2.4 GHz**. ESP32 tidak dapat mendeteksi atau menyambung ke Wi-Fi 5 GHz. Jika menggunakan Hotspot HP, pastikan pengaturan AP Band diatur ke 2.4 GHz.

---

### Langkah 7: Mengunggah Seluruh File Firmware ke ESP32
1. Di Thonny, buka menu: **View** $\rightarrow$ centang **Files**. Panel file explorer akan muncul di sebelah kiri layar Thonny.
2. Di panel atas (*This computer*), arahkan ke folder: `c:\XII SIJA 2\IOT\smart-dispenser\firmware`.
3. Pilih semua file `.py` di dalam folder tersebut:
   - `boot.py`
   - `main.py`
   - `config.py`
   - `secrets.py`
   - `wifi_manager.py`
   - `sensors.py`
   - `flow_meter.py`
   - `relay_controller.py`
   - `pump_controller.py`
   - `buzzer.py`
   - `ai_classifier.py`
   - `safety_controller.py`
   - `cloud_client.py`
   - `command_handler.py`
   - `event_logger.py`
   - `test_cloud.py`
4. Klik kanan pada file-file yang dipilih, lalu klik **"Upload to /"** (Unggah ke root ESP32).
5. File-file tersebut sekarang telah tersimpan permanen di dalam flash memory ESP32.

---

### Langkah 8: Menguji Sambungan Wi-Fi
1. Di Thonny, buka file `wifi_manager.py` yang ada di ESP32.
2. Tekan tombol **F5** (Run current script) atau klik ikon panah hijau **Run**.
3. Di panel Shell, Anda akan melihat output:
   ```text
   [WIFI] Menghubungkan ke SSID: 'LAB_SIJA_24G'...
   [WIFI] Terhubung! IP: 192.168.1.105, Gateway: 192.168.1.1
   ```
4. Catat alamat IP lokal ESP32 Anda tersebut.

Lanjutkan ke: **[Tutorial 05: Menghubungkan ESP32 ke Cloud API](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/05-esp32-ke-cloud.md)**.
