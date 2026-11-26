# test_hardware.py — Script Pengujian Hardware Fisik Smart Dispenser
# Grade XII SIJA UKL 3 - SMK Telkom Sidoarjo
#
# Script ini digunakan untuk mengetes semua aktuator & sensor fisik secara LOKAL
# LANGSUNG DI ESP32 TANPA PERLU KONEKSI INTERNET / WEB / CLOUD!
#
# Cara Pakai:
# 1. Buka file ini di VS Code (MicroPico) atau Thonny
# 2. Klik tombol Run (F5)
# 3. Amati relay berbunyi "klik", pompa menyedot air selama 3 detik, buzzer berbunyi,
#    dan nilai semua sensor muncul di Terminal/Shell.

import time
import machine
import config
from sensors import UltrasonicSensor, SpillSensor
from flow_meter import FlowMeter
from relay_controller import RelayController
from buzzer import BuzzerController

print("=" * 60)
print("  PENGUJIAN HARDWARE LOKAL — SMART DISPENSER IoT")
print("  SMK Telkom Sidoarjo - Grade XII SIJA")
print("=" * 60)

# 1. Inisialisasi Aktuator
print("[1/5] Inisialisasi Buzzer (GPIO 25)...")
buzzer = BuzzerController(config.PIN_BUZZER_PWM)
buzzer.beep_success()
time.sleep(0.5)

print("[2/5] Inisialisasi Relay & Pompa (GPIO 26)...")
relay = RelayController(config.PIN_RELAY_IN, active_low=config.RELAY_ACTIVE_LOW)
# Pastikan pompa awalnya mati
relay.deactivate()

print("[3/5] Inisialisasi Sensor Ultrasonik & Baki...")
cup_sensor = UltrasonicSensor(config.PIN_CUP_TRIG, config.PIN_CUP_ECHO)
reservoir_sensor = UltrasonicSensor(config.PIN_RESERVOIR_TRIG, config.PIN_RESERVOIR_ECHO)
spill_sensor = SpillSensor(config.PIN_SPILL_ADC)

print("[4/5] Inisialisasi Sensor Flow Meter (GPIO 27)...")
flow_meter = FlowMeter(config.PIN_FLOW_SIGNAL, config.FLOW_PULSES_PER_ML)
flow_meter.reset_session()

print("\n" + "=" * 60)
print("  MENU PENGUJIAN HARDWARE:")
print("  1. Tes Pompa Menyedot Air (Nyala 3 Detik)")
print("  2. Tes Bunyi Buzzer (Beep Peringatan)")
print("  3. Baca Semua Sensor Realtime (Cangkir, Tandon, Baki, Flow)")
print("  4. Tes Dispensing Otomatis Lokal (Auto-Fill saat ada cangkir)")
print("=" * 60)

def test_pump(duration_sec=3):
    """Menyalakan relay pompa selama durasi detik tertentu lalu mematikannya."""
    print(f"\n>>> MENYALAKAN POMPA SELAMA {duration_sec} DETIK... <<<")
    buzzer.beep_once(1500, 100)
    flow_meter.reset_session()
    relay.activate()
    
    start = time.time()
    while time.time() - start < duration_sec:
        pulses = flow_meter.get_session_pulses()
        ml = flow_meter.get_measured_volume_ml()
        print(f"    [POMPA ON] Aliran air: {pulses} pulsa | ~{ml:.1f} ml")
        time.sleep(0.5)
        
    relay.deactivate()
    buzzer.beep_success()
    total_ml = flow_meter.get_measured_volume_ml()
    print(f">>> POMPA DIMATIKAN! Total air terukur: {total_ml:.1f} ml <<<\n")

def test_sensors_monitor(seconds=15):
    """Menampilkan data semua sensor ke terminal secara langsung."""
    print(f"\n>>> MEMBACA SEMUA SENSOR REALTIME ({seconds} DETIK)... <<<")
    print("    Silakan coba taruh tangan di depan sensor cangkir / tandon.")
    start = time.time()
    while time.time() - start < seconds:
        cup_cm = cup_sensor.measure_distance_cm()
        res_cm = reservoir_sensor.measure_distance_cm()
        spill, adc = spill_sensor.check_spill()
        pulses = flow_meter.get_session_pulses()
        
        status_cangkir = "ADA GELAS" if (0 < cup_cm <= 10.0) else "KOSONG"
        status_baki = "BASAH (TUMPAHAN!)" if spill else "KERING"
        
        print(f"    Cangkir: {cup_cm:5.1f} cm ({status_cangkir}) | Tandon: {res_cm:5.1f} cm | Baki ADC: {adc:4d} ({status_baki}) | Flow: {pulses} p")
        time.sleep(0.8)
    print(">>> Selesai membaca sensor. <<<\n")

def auto_dispense_demo():
    """
    Mode dispenser pintar lokal mandiri:
    Jika ada cangkir didekatkan (< 10 cm), otomatis isi air sampai 100 ml atau sampai cangkir diangkat!
    """
    print("\n>>> MODE DISPENSER PINTAR OTOMATIS AKTIF <<<")
    print("    - Dekatkan cangkir (< 10 cm) ke sensor untuk mulai mengisi air.")
    print("    - Angkat cangkir atau tunggu hingga 100ml untuk berhenti otomatis.")
    print("    - Tekan Ctrl+C di keyboard untuk menghentikan program.")
    
    while True:
        cup_cm = cup_sensor.measure_distance_cm()
        cup_ada = (0 < cup_cm <= 10.0)
        spill, _ = spill_sensor.check_spill()
        
        if cup_ada and not spill:
            print(f"\n[GELAS TERDETEKSI: {cup_cm:.1f} cm] Memulai pengisian air otomatis...")
            buzzer.beep_once(2000, 80)
            time.sleep(0.3)
            buzzer.beep_once(2000, 80)
            
            relay.activate()
            flow_meter.reset_session()
            start_fill = time.ticks_ms()
            target_ml = 100.0
            
            while True:
                # Cek keselamatan saat pengisian
                cur_cup = cup_sensor.measure_distance_cm()
                cur_spill, _ = spill_sensor.check_spill()
                pulses = flow_meter.get_session_pulses()
                ml = flow_meter.get_measured_volume_ml()
                dur_ms = time.ticks_diff(time.ticks_ms(), start_fill)
                
                print(f"    Mengisi: {ml:.1f} / {target_ml:.0f} ml ({pulses} pulsa) | Jarak: {cur_cup:.1f} cm")
                
                # Syarat berhenti:
                # 1. Volume tercapai
                if ml >= target_ml:
                    print(">>> Target 100 ml tercapai! Mematikan pompa.")
                    break
                # 2. Cangkir diangkat
                if cur_cup > 12.0 or cur_cup < 0:
                    print(">>> Cangkir diangkat! Safety cut-off aktif.")
                    break
                # 3. Tumpahan terdeteksi
                if cur_spill:
                    print(">>> PERINGATAN: Tumpahan air terdeteksi! Pompa dimatikan.")
                    break
                # 4. Batas waktu maksimum (15 detik)
                if dur_ms > 15000:
                    print(">>> Batas waktu pengisian tercapai (15s).")
                    break
                    
                time.sleep(0.3)
                
            relay.deactivate()
            buzzer.beep_success()
            print(f">>> Pengisian selesai. Air keluar: {flow_meter.get_measured_volume_ml():.1f} ml.\n")
            print("Silakan ambil gelas Anda...")
            time.sleep(2.0)
        else:
            time.sleep(0.5)

# JALANKAN OTOMATIS:
# Pertama jalankan tes pompa 3 detik untuk memastikan pompa & relay bekerja!
print("\n>>> Menjalankan Tes Pompa 3 Detik Sekarang... <<<")
test_pump(duration_sec=3)

# Kedua, pantau sensor selama 10 detik
test_sensors_monitor(seconds=10)

# Ketiga, masuk ke mode Dispenser Otomatis Lokal
auto_dispense_demo()
