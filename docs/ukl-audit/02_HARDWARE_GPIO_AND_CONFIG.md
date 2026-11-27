# 02 — HARDWARE GPIO MAPPING & CONFIGURATION AUDIT
## Smart Dispenser IoT — SMK Telkom Sidoarjo (Kelas XII SIJA 2)

**Audit Date:** 2026-11-26  
**Auditor:** Senior IoT, Embedded Systems & Cloud Security Auditor  
**Evidence Standard:** Strict Code-Backing (`[SOURCE CODE VERIFIED]`, `[STATIC INSPECTION ONLY]`, `[TEST LOG VERIFIED]`, `[DOCUMENTATION CLAIM ONLY]`, `[NOT VERIFIED]`, `[IMPLEMENTATION MISMATCH]`)

---

### 1. Master GPIO Mapping Table `[SOURCE CODE VERIFIED]`

The following table reflects the exact physical pin configuration executed at runtime:

| Component Name | Pin | Direction / Mode | Supply Voltage | Logic Polarity | Firmware Variable | Source File & Line Number | Notes / Engineering Rationale |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| **Cup Ultrasonic Sensor (TRIG)** | **GPIO 13** | Digital Output | 5.0V (VCC) / 3.3V Logic | Active-HIGH | `PIN_CUP_TRIG` | [firmware/config.py#L7](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L7) | $10\,\mu\text{s}$ trigger pulse sent to HC-SR04 |
| **Cup Ultrasonic Sensor (ECHO)** | **GPIO 14** | Digital Input | 3.3V (via Resistor Divider) | Active-HIGH | `PIN_CUP_ECHO` | [firmware/config.py#L8](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L8) | Measures high-pulse duration via `time_pulse_us` |
| **Reservoir Ultrasonic (TRIG)** | **GPIO 16** | Digital Output | 5.0V (VCC) / 3.3V Logic | Active-HIGH | `PIN_RESERVOIR_TRIG` | [firmware/config.py#L9](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L9) | Trigger pulse sent to top container HC-SR04 |
| **Reservoir Ultrasonic (ECHO)** | **GPIO 17** | Digital Input | 3.3V (via Resistor Divider) | Active-HIGH | `PIN_RESERVOIR_ECHO` | [firmware/config.py#L10](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L10) | Measures echo pulse for tank level percentage |
| **YF-S201 Flow Sensor** | **GPIO 27** | Digital Input (PULL_UP) | 5.0V (VCC) / 3.3V Logic | Active-LOW (Falling Edge) | `PIN_FLOW_SIGNAL` | [firmware/config.py#L11](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L11) | Hardware Interrupt `Pin.IRQ_FALLING` [firmware/flow_meter.py#L17](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/flow_meter.py#L17) |
| **Relay Modul Pompa DC** | **GPIO 26** | Digital Output | 5.0V (VCC) / 3.3V Logic | **Active-LOW** ($0=\text{ON}, 1=\text{OFF}$) | `PIN_RELAY_IN` | [firmware/config.py#L12](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L12) | Initialized to `OFF` immediately at boot [firmware/relay_controller.py#L12](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/relay_controller.py#L12) |
| **Spill Sensor Baki Tetesan** | **GPIO 34** | Analog Input (ADC1) | 3.3V | Analog Value ($0 - 4095$) | `PIN_SPILL_ADC` | [firmware/config.py#L13](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L13) | ADC attenuation 11dB ($0 - 3.3\text{V}$), 12-bit width [firmware/sensors.py#L41-L42](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/sensors.py#L41-L42) |
| **Buzzer Alarm Pasif** | **GPIO 25** | Digital / PWM Output | 3.3V / 5.0V | Dynamic PWM Duty Cycle | `PIN_BUZZER_PWM` | [firmware/config.py#L14](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L14) | PWM generator ($880\text{ Hz} - 2000\text{ Hz}$) [firmware/buzzer.py#L19-L20](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/buzzer.py#L19-L20) |

---

### 2. Physical Sensor Thresholds & Operational Limits `[SOURCE CODE VERIFIED]`

All parameters extracted directly from `firmware/config.py`:

| Parameter Identifier | Configured Value | Unit | Engineering Purpose & Boundary | Source File & Line Number |
| :--- | :---: | :---: | :--- | :--- |
| `CUP_MIN_VALID_CM` | `2.0` | cm | Minimum physical distance to reject near-field acoustic ringdown | [firmware/config.py#L23](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L23) |
| `CUP_MAX_VALID_CM` | `40.0` | cm | Maximum valid physical range for cup ultrasonic enclosure | [firmware/config.py#L24](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L24) |
| `CUP_DETECTED_MAX_CM` | `10.0` | cm | Threshold below which a cup is deemed physically present | [firmware/config.py#L25](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L25) |
| `RESERVOIR_FULL_DISTANCE_CM` | `4.0` | cm | Ultrasonic distance when water tank is at $100\%$ capacity | [firmware/config.py#L28](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L28) |
| `RESERVOIR_EMPTY_DISTANCE_CM` | `18.0` | cm | Ultrasonic distance when water tank is empty ($0\%$ capacity) | [firmware/config.py#L29](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L29) |
| `RESERVOIR_LOW_THRESHOLD_PCT` | `20.0` | % | Water level warning threshold triggering refilling prompt | [firmware/config.py#L30](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L30) |
| `RESERVOIR_CRITICAL_PCT` | `10.0` | % | Hard shutoff threshold: pump execution strictly locked | [firmware/config.py#L31](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L31) |
| `SPILL_DRY_BASELINE` | `350` | ADC | Expected raw ADC reading when drip tray is dry | [firmware/config.py#L34](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L34) |
| `SPILL_THRESHOLD_ADC` | `1200` | ADC | Wet condition trigger: initiates immediate pump emergency stop | [firmware/config.py#L35](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L35) |
| `SPILL_HYSTERESIS_ADC` | `150` | ADC | Hysteresis margin to prevent oscillation around trigger point | [firmware/config.py#L36](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L36) |
| `FLOW_PULSES_PER_ML` | `15.0` | pulses/ml | Calibrated turbine conversion ratio ($15000\text{ pulses/Liter}$) | [firmware/config.py#L41](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L41) |
| `FLOW_CUTOFF_OFFSET_ML` | `5.0` | ml | Fluid momentum compensation: relay shuts off $5\text{ ml}$ early | [firmware/config.py#L45](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L45) |
| `FLOW_NO_PULSE_TIMEOUT_MS` | `5000` | ms | Dry-run / blockage timeout: triggers pump shutoff | [firmware/config.py#L47](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L47) |
| `MAX_DISPENSE_DURATION_MS` | `25000` | ms | Hard safety timeout: pump forced OFF after $25\text{ seconds}$ | [firmware/config.py#L48](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L48) |
| `RELAY_ACTIVE_LOW` | `True` | bool | Hardware relay polarity configuration ($0=\text{Active}, 1=\text{Inactive}$) | [firmware/config.py#L19](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L19) |
| `BYPASS_SAFETY_FOR_TEST` | `False` | bool | Testing bypass switch (Production default MUST be `False`) | [firmware/config.py#L55](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L55) |
| `TELEMETRY_INTERVAL_MS` | `1000` | ms | Idle state cloud telemetry transmission cadence | [firmware/config.py#L58](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L58) |
| `COMMAND_POLL_INTERVAL_MS`| `800` | ms | HTTP command polling cadence from Next.js gateway | [firmware/config.py#L59](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L59) |

---

### 3. Configuration Conflict Table `[IMPLEMENTATION MISMATCH]`

The audit revealed discrepancies between theoretical documentation, initial model configurations, and runtime firmware:

| Configuration Item | Runtime Firmware Value (`config.py`) | Model Config Value (`ai/model_config.json`) | Tutorial Doc Claim (`docs/`) | Operational Impact & Audit Determination |
| :--- | :---: | :---: | :---: | :--- |
| **Flow Calibration Factor** | **`15.0` pulsa/ml** | `1.2` pulsa/ml (`model_config.json:L43`) | `1.2` pulsa/ml (`docs/tutorial/11:L24`) | **Conflict resolved in runtime:** Firmware uses `15.0`. The value in `model_config.json` is legacy uncalibrated boilerplate. |
| **No-Pulse Timeout** | **`5000` ms** | `2500` ms (`model_config.json:L44`) | `2500` ms (`docs/tutorial/05:L88`) | **Conflict resolved in runtime:** `config.py` was extended to `5000` ms to tolerate initial pump priming delay. |
| **Dispense Presets** | `50, 100, 200` ml (Dynamic) | Not defined | `100, 200, 300, 500` ml (`docs/tutorial/08:L15`) | **Web implementation discrepancy:** [web/src/lib/constants.ts#L4](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/lib/constants.ts#L4) defines `[50, 100, 200, 300]`, while early tutorials stated `500` ml. |
| **Cutoff Lead Offset** | **`5.0` ml** | Not documented | `0.0` ml (Not implemented in early doc) | **Recent enhancement:** [firmware/config.py#L45](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L45) added `FLOW_CUTOFF_OFFSET_ML = 5.0` to compensate for tube drainage inertia. |
| **Local Gateway Timings** | **`1000` ms / `800` ms** | Not defined | `2000` ms / `1500` ms (`docs/tutorial/06:L42`) | **Conflict resolved in runtime:** Timings were decreased in `config.py` to achieve responsive local control. |

---

### 4. Buzzer Acoustic Frequency and Signaling Patterns `[SOURCE CODE VERIFIED]`

Extracted from [firmware/buzzer.py#L32-L54](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/buzzer.py#L32-L54):

1. **`beep_start()` (Start Dispensing):**
   * Single Tone: $1046\text{ Hz}$ (C6 note), duration: $100\text{ ms}$.
2. **`beep_success()` (Completion):**
   * Dual Ascending Chime: $1318\text{ Hz}$ (E6) for $80\text{ ms} \rightarrow$ Pause $40\text{ ms} \rightarrow 1760\text{ Hz}$ (A6) for $120\text{ ms}$.
3. **`beep_warning()` (Cautionary Warning):**
   * Repeated Tone: $880\text{ Hz}$ (A5) for $120\text{ ms} \times 2$ pulses with $80\text{ ms}$ silence interval.
4. **`beep_alarm()` (Critical Emergency Shutdown):**
   * High-Low Alarm Siren: Alternates $2000\text{ Hz}$ ($100\text{ ms}$) and $1500\text{ Hz}$ ($100\text{ ms}$) repeated 3 times ($50\text{ ms}$ pause). Total acoustic duration: $450\text{ ms}$.
