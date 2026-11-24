# test_cloud.py — Standalone Diagnostic Cloud API Test for ESP32
# Jalankan file ini secara mandiri di Thonny untuk memverifikasi koneksi Wi-Fi
# dan komunikasi HTTPS REST ke Next.js sebelum mengunggah keseluruhan firmware.

import time
import urequests
import ujson

try:
    import secrets
except ImportError:
    print("=" * 60)
    print("ERROR: File 'secrets.py' belum dibuat!")
    print("Silakan salin 'secrets.example.py' menjadi 'secrets.py' dan isi nilainya.")
    print("=" * 60)
    raise SystemExit

from wifi_manager import WiFiManager

print("=" * 60)
print("  DIAGNOSTIK KONEKSI CLOUD API — SMART DISPENSER IoT")
print(f"  Target Gateway: {secrets.API_BASE_URL}")
print("=" * 60)

# 1. Test Wi-Fi Connection
wifi_list = getattr(secrets, 'WIFI_NETWORKS', [(secrets.WIFI_SSID, secrets.WIFI_PASSWORD)])
wifi = WiFiManager(networks=wifi_list)
print("[1/3] Menghubungkan ke Wi-Fi...")
if not wifi.connect(timeout_sec=15):
    print("FATAL: Gagal terhubung ke Wi-Fi. Cek kembali SSID dan password.")
    raise SystemExit

print("[1/3] Wi-Fi berhasil terhubung!")

# 2. Test Telemetry Endpoint
print("\n[2/3] Mengirim uji data telemetri simulasi ke server...")
test_payload = {
    "deviceId": "dispenser01",
    "timestamp": time.time(),
    "telemetry": {
        "cup_distance_cm": 6.5,
        "cup_detected": True,
        "reservoir_distance_cm": 5.0,
        "reservoir_percentage": 78.5,
        "tray_adc": 310,
        "spill_detected": False,
        "flow_pulses": 0,
        "measured_volume_ml": 0,
        "pump_running": False,
        "buzzer_active": False,
        "ai_classification": "AMAN",
        "ai_risk_level": "LOW",
        "ai_explanation": "Uji coba diagnostik dari script test_cloud.py",
        "wifi_rssi": -55,
        "ip_address": wifi.get_info().get("ip")
    }
}

headers = {
    "Content-Type": "application/json",
    "X-Device-Token": secrets.DEVICE_SECRET_TOKEN,
    "X-Device-ID": "dispenser01"
}

url_telemetry = f"{secrets.API_BASE_URL.rstrip('/')}/api/device/telemetry"
try:
    res = urequests.post(url_telemetry, data=ujson.dumps(test_payload), headers=headers, timeout=10)
    print(f"HTTP Status: {res.status_code}")
    print(f"Response Server: {res.text}")
    if res.status_code in (200, 201):
        print("[2/3] BERHASIL: Gateway menerima telemetri dan menulis ke Firebase!")
    else:
        print(f"[2/3] GAGAL: Server merespons dengan status {res.status_code}")
    res.close()
except Exception as e:
    print(f"[2/3] ERROR KONEKSI: {e}")

# 3. Test Command Polling Endpoint
print("\n[3/3] Melakukan polling perintah ke GET /api/device/commands...")
url_commands = f"{secrets.API_BASE_URL.rstrip('/')}/api/device/commands?deviceId=dispenser01"
try:
    res = urequests.get(url_commands, headers=headers, timeout=10)
    print(f"HTTP Status: {res.status_code}")
    print(f"Response Server: {res.text}")
    if res.status_code == 200:
        print("[3/3] BERHASIL: Endpoint polling perintah berfungsi normal!")
    else:
        print(f"[3/3] GAGAL: Status {res.status_code}")
    res.close()
except Exception as e:
    print(f"[3/3] ERROR KONEKSI: {e}")

print("\n" + "=" * 60)
print("DIAGNOSTIK SELESAI. Jika semua pengujian berstatus BERHASIL,")
print("ESP32 Anda siap menjalankan 'main.py' secara penuh.")
print("=" * 60)
