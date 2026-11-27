# CONFIGURATION FILE — SMART DISPENSER IoT
# Grade XII SIJA UKL 3 - SMK Telkom Sidoarjo
# Hardware pinout and calibrated parameters

# ================= GPIO PIN ASSIGNMENTS =================
# NEVER CHANGE THESE VALUES - MANDATORY SPECIFICATION
PIN_CUP_TRIG = 13
PIN_CUP_ECHO = 14
PIN_RESERVOIR_TRIG = 16
PIN_RESERVOIR_ECHO = 17
PIN_FLOW_SIGNAL = 27
PIN_RELAY_IN = 26
PIN_SPILL_ADC = 34
PIN_BUZZER_PWM = 25

# ================= RELAY & PUMP POLARITY =================
# Most 5V relay modules are ACTIVE-LOW (0 = Relay ON, 1 = Relay OFF)
# If your module is ACTIVE-HIGH, set this to False.
RELAY_ACTIVE_LOW = True

# ================= SENSOR CALIBRATION =================
# Mode Pembacaan Sensor Ultrasonik Fisik Asli (HC-SR04 Hardware)
SIMULATE_ULTRASONIC = False
FALLBACK_SIMULATE_ON_ERROR = False

# Cup Ultrasonic Detection
CUP_MIN_VALID_CM = 2.0
CUP_MAX_VALID_CM = 40.0
CUP_DETECTED_MAX_CM = 10.0  # Cup is present if distance <= 10.0 cm

# Reservoir Ultrasonic Calibration (Miniature Container)
RESERVOIR_FULL_DISTANCE_CM = 4.0    # Distance when tank is 100% full
RESERVOIR_EMPTY_DISTANCE_CM = 18.0  # Distance when tank is 0% (empty)
RESERVOIR_LOW_THRESHOLD_PCT = 20.0  # Warning threshold (%)
RESERVOIR_CRITICAL_PCT = 10.0       # Pump shutoff threshold (%)

# Spill Sensor (GPIO34 ADC 12-bit: 0 - 4095)
SPILL_DRY_BASELINE = 350
SPILL_THRESHOLD_ADC = 1200          # Wet condition trigger
SPILL_HYSTERESIS_ADC = 150

# YF-S201 Flow Sensor Calibration
# Pulses per milliliter (calibrated experimentally with measuring cup)
# Nilai disesuaikan dari 15.0 menjadi 3.8 pulsa/ml agar saat pilih 50 ml, air yang keluar tepat 50 ml (tidak 200 ml lagi)
FLOW_PULSES_PER_ML = 3.8

# Kompensasi Inersia & Tetesan Akhir Aliran Air (After-Drip Offset)
# Pompa dimatikan sekian ml lebih awal agar dorongan sisa air menggenapi takaran gelas
FLOW_CUTOFF_OFFSET_ML = 5.0

FLOW_NO_PULSE_TIMEOUT_MS = 5000     # Batas toleransi tanpa pulsa (5 detik) agar pompa tidak mati dini
MAX_DISPENSE_DURATION_MS = 25000    # Hard cutoff duration for dispensing safety

# ================= CLOUD / LOCAL GATEWAY SYNC TOGGLE =================
# Set True agar ESP32 mengirim telemetri & menerima perintah dari Web di Laptop (Lokal API)
ENABLE_CLOUD_SYNC = True

# Mode pengujian cepat pompa (Set True jika ingin pompa bisa nyala dari web meskipun cangkir belum dipasang)
BYPASS_SAFETY_FOR_TEST = False

# ================= LOCAL TIMINGS (Super Cepat di Jaringan Wi-Fi Lokal) =================
TELEMETRY_INTERVAL_MS = 1000        # Kirim telemetri ke web laptop setiap 1.0 detik
COMMAND_POLL_INTERVAL_MS = 800      # Ambil perintah tombol web setiap 0.8 detik (Respons cepat!)
WIFI_RECONNECT_INTERVAL_MS = 5000   # Cek ulang koneksi Wi-Fi
DEVICE_ID = "dispenser01"
