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
# Default starting reference is ~1.20 pulses/ml (1200 pulses per Liter)
FLOW_PULSES_PER_ML = 1.20
FLOW_NO_PULSE_TIMEOUT_MS = 2500     # Time without pulses before warning if pump ON
MAX_DISPENSE_DURATION_MS = 25000    # Hard cutoff duration for dispensing safety

# ================= CLOUD & TIMINGS =================
TELEMETRY_INTERVAL_MS = 2500        # Send telemetry every 2.5 seconds
COMMAND_POLL_INTERVAL_MS = 1500     # Poll pending commands every 1.5 seconds
WIFI_RECONNECT_INTERVAL_MS = 10000   # Retry Wi-Fi connection if dropped
DEVICE_ID = "dispenser01"
