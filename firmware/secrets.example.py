# SECRETS CONFIGURATION TEMPLATE — SMART DISPENSER IoT
# Salin file ini menjadi `secrets.py` pada ESP32 menggunakan Thonny IDE.
# JANGAN PERNAH mengunggah `secrets.py` yang berisi password asli ke Git/GitHub!

# Konfigurasi Jaringan Wi-Fi (Wajib 2.4 GHz)
WIFI_SSID = "SMK_TELKOM_IOT"
WIFI_PASSWORD = "PasswordWifiAnda"

# Konfigurasi Gateway Cloud API (Next.js Deployed / Tunnel URL)
# Contoh produksi Vercel: "https://smart-dispenser-sija.vercel.app"
# Contoh pengujian lokal via ngrok/localtunnel: "https://abcdef.ngrok-free.app"
# PERHATIAN: ESP32 tidak bisa mengakses "http://localhost:3000"!
API_BASE_URL = "https://smart-dispenser-sija.vercel.app"

# Token Otentikasi Perangkat (Shared Secret antara ESP32 dan Backend)
# Hash SHA-256 dari token ini harus dikonfigurasikan di .env.local backend Next.js
DEVICE_SECRET_TOKEN = "sija_dispenser_super_secret_token_2026"
