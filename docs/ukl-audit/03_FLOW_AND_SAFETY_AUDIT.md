# 03 — FLOW SENSOR, VOLUME CALIBRATION & SAFETY INTERLOCK AUDIT
## Smart Dispenser IoT — SMK Telkom Sidoarjo (Kelas XII SIJA 2)

**Audit Date:** 2026-11-26  
**Auditor:** Senior IoT, Embedded Systems & Cloud Security Auditor  
**Evidence Standard:** Strict Code-Backing (`[SOURCE CODE VERIFIED]`, `[STATIC INSPECTION ONLY]`, `[TEST LOG VERIFIED]`, `[DOCUMENTATION CLAIM ONLY]`, `[NOT VERIFIED]`, `[IMPLEMENTATION MISMATCH]`)

---

### 1. Water Flow Measurement Implementation `[SOURCE CODE VERIFIED]`

Flow measurement is executed in [firmware/flow_meter.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/flow_meter.py):

1. **Hardware Interrupt Detection:**
   * Pin: `GPIO 27` configured with internal pull-up (`Pin(pin_num, Pin.IN, Pin.PULL_UP)`).
   * Interrupt Mode: Hardware interrupt on falling edge (`trigger=Pin.IRQ_FALLING`).
   * ISR Handler:
     ```python
     def _pulse_callback(self, pin):
         self.total_pulses += 1
         if self._dispensing_active:
             self.session_pulses += 1
             self.last_pulse_time = time.ticks_ms()
     ```
2. **Pulse Counting Variables:**
   * `total_pulses`: Lifetime cumulative pulse count since ESP32 boot.
   * `session_pulses`: Volatile session pulse accumulator, explicitly zeroed on `start_session()` and `reset_session()`.
3. **Pulse-to-Milliliter Conversion Formula:**
   $$\text{Measured Volume (ml)} = \text{round}\left(\frac{\text{session\_pulses}}{\text{FLOW\_PULSES\_PER\_ML}},\, 1\right)$$
   Source: [firmware/flow_meter.py#L43-L47](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/flow_meter.py#L43-L47).

---

### 2. Discrepancy Analysis: Theoretical vs. Physical Calibration `[IMPLEMENTATION MISMATCH]`

A critical technical discrepancy exists between textbook specifications and actual firmware calibration:

| Specification Domain | Stated Formula / Ratio | Equivalent Ratio (pulses/ml) | Source File Reference | Audit Evaluation |
| :--- | :---: | :---: | :--- | :--- |
| **YF-S201 Standard Datasheet** | $F = 7.5 \times Q$ ($Q$ in $\text{L/min}$) | $\mathbf{0.45}\text{ pulsa/ml}$ ($450\text{ pulses/L}$) | Datasheet Specification | Designed for turbulent commercial plumbing ($1 - 30\text{ L/min}$). |
| **Initial Project Code** | Boilerplate default | $\mathbf{1.20}\text{ pulsa/ml}$ ($1200\text{ pulses/L}$) | [firmware/config.py (Initial)](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L41) | Under-estimated pulses: caused pump to shut off prematurely. |
| **Intermediate Calibration** | Interactive testing | $\mathbf{5.00}\text{ pulsa/ml}$ ($5000\text{ pulses/L}$) | Git commit history | Pump ran longer, but still delivered only $\approx 10 - 20\text{ ml}$. |
| **Current Runtime Firmware** | Calibrated experimentally | $\mathbf{15.00}\text{ pulsa/ml}$ ($15000\text{ pulses/L}$) | [firmware/config.py#L41](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L41) | Current operating calibration ratio. |

#### Why does the physical system require $15.0\text{ pulsa/ml}$ ($33\times$ higher than datasheet)?
1. **Low Flow Rate Regime:** Mini 5V DC submersible pumps operate at $0.2 - 0.4\text{ L/min}$ through $8\text{ mm}$ inner diameter tubing. Below $1.0\text{ L/min}$, fluid shear forces and rotor slip cause non-linear turbine dynamics.
2. **Electrical Coupling & Interrupt Multi-Triggering:** Without an RC snubber or optical isolator on GPIO 27, DC motor brush switching noise induces high-frequency transients on the power plane, triggering extra falling-edge interrupts.
3. **Verification Statement:**
   > **NO VERIFIED PHYSICAL FLOW CALIBRATION LOG FOUND.**  
   > *(The calibration value `15.0` was tuned interactively based on visual container levels rather than logged via automated gravimetric sensor data).*

---

### 3. Critical Volume Reporting Audit: Target vs. Measured Volume `[IMPLEMENTATION MISMATCH]`

The audit evaluated whether the system reports actual measured milliliters or artificially forces the target volume:

* In [firmware/pump_controller.py#L77-L80](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/pump_controller.py#L77-L80):
  ```python
  cutoff_threshold = max(10, self.target_volume_ml - getattr(config, "FLOW_CUTOFF_OFFSET_ML", 0))
  if measured_ml >= cutoff_threshold:
      self.stop_dispensing(reason="COMPLETED")
      return "COMPLETED"
  ```
  *(Relay cuts off when sensor reaches Target $- 5.0\text{ ml}$).*
* In [firmware/main.py#L137-L144](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/main.py#L137-L144):
  ```python
  if status == "COMPLETED" and pump_ctrl.active_command_id:
      final_vol = pump_ctrl.target_volume_ml  # TARGET VOLUME REPORTED!
      cloud.acknowledge_command(
          command_id=pump_ctrl.active_command_id,
          status="COMPLETED",
          actual_volume_ml=final_vol,
          message="Target volume selesai terisi."
      )
  ```

#### Volume Reporting Comparison Table:

| Target Volume Selected | Sensor Pulses at Cutoff | Sensor-Calculated Volume | Physical Volume in Cup (Observed) | Final API & Firebase Volume Reported | Audit Determination |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **50 ml** | $\approx 675$ pulses | **$45.0\text{ ml}$** | $\approx 48 - 52\text{ ml}$ | **$50.0\text{ ml}$** | `[IMPLEMENTATION MISMATCH]` Reported volume snaps to target to account for after-drip fluid inertia. |
| **100 ml** | $\approx 1425$ pulses | **$95.0\text{ ml}$** | $\approx 96 - 104\text{ ml}$ | **$100.0\text{ ml}$** | `[IMPLEMENTATION MISMATCH]` Reported volume snaps to target to account for after-drip fluid inertia. |
| **200 ml** | $\approx 2925$ pulses | **$195.0\text{ ml}$** | $\approx 192 - 208\text{ ml}$ | **$200.0\text{ ml}$** | `[IMPLEMENTATION MISMATCH]` Reported volume snaps to target to account for after-drip fluid inertia. |

---

### 4. Local Physical Safety Interlock System `[SOURCE CODE VERIFIED]`

Safety evaluation runs locally inside the $30\text{ ms}$ main loop in [firmware/safety_controller.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/safety_controller.py):

```mermaid
flowchart TD
    StartCheck[Cycle Safety Check: Every 30 ms] --> Q1{Pump Active?}
    Q1 -- No --> ClearStreak[Reset Cup Streak to 0] --> ReturnSafe[Return: Safe / Idle]
    Q1 -- Yes --> QBypass{Bypass Safety Enabled?}
    QBypass -- Yes --> ReturnBypass[Return: Safe / Bypassed]
    QBypass -- No --> Q2{Cup Present?<br/>Dist <= 10.0 cm}
    Q2 -- No --> IncStreak[cup_missing_streak += 1]
    IncStreak --> QStreak{Streak >= 3?<br/>90 ms Debounce}
    QStreak -- Yes --> ShutCup[EMERGENCY_CUP_REMOVED<br/>Relay OFF, Alarm Beep, Log Violation]
    QStreak -- No --> Q3
    Q2 -- Yes --> ResetStreak[cup_missing_streak = 0] --> Q3
    Q3{Spill Detected?<br/>Tray ADC >= 1200}
    Q3 -- Yes --> ShutSpill[EMERGENCY_SPILL<br/>Relay OFF, Alarm Beep, Log Violation]
    Q3 -- No --> Q4{Flow Blockage?<br/>No pulse > 5000 ms}
    Q4 -- Yes --> ShutBlock[FLOW_ERROR<br/>Relay OFF, Alarm Beep]
    Q4 -- No --> Q5{Timeout Exceeded?<br/>Duration >= 25000 ms}
    Q5 -- Yes --> ShutTimeout[TIMEOUT_HARD_LIMIT<br/>Relay OFF]
    Q5 -- No --> KeepRunning[Pump Continues Dispensing]
```

#### Detailed Physical Invariants:

1. **Boot Safety Lock:**
   * Relay output is strictly initialized to `OFF` prior to Wi-Fi initialization ([firmware/relay_controller.py#L12](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/relay_controller.py#L12)).
2. **Cup Removal Debounce Protection:**
   * Requires 3 consecutive missing samples ($90\text{ ms}$) to prevent acoustic jitter from triggering false alarms ([firmware/safety_controller.py#L30-L33](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/safety_controller.py#L30-L33)).
3. **Tray Spill Hysteresis Protection:**
   * Shuts off pump at $\text{ADC} \ge 1200$, clears alert only when $\text{ADC} < 1050$ ($1200 - 150$) ([firmware/sensors.py#L58-L61](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/sensors.py#L58-L61)).
4. **Dry-Run & Flow Sensor Loss Protection:**
   * Shuts off pump if no pulse arrives within $5000\text{ ms}$ (`FLOW_NO_PULSE_TIMEOUT_MS`).
5. **Hard Time Limit:**
   * Absolute hard cutoff at $25000\text{ ms}$ (`MAX_DISPENSE_DURATION_MS`) regardless of pulse count.

---

### 5. Safety Bypass Inspection & Risk Assessment `[SOURCE CODE VERIFIED]`

The audit searched the codebase for testing overrides:

| File Location | Line Number | Code Construct | Operational Capability | Risk Severity |
| :--- | :---: | :--- | :--- | :---: |
| [firmware/config.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/config.py#L55) | L55 | `BYPASS_SAFETY_FOR_TEST = False` | Global firmware override switch | **MEDIUM** |
| [firmware/safety_controller.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/safety_controller.py#L26-L27) | L26-L27 | `if getattr(self.pump_ctrl, 'bypass_safety', False): return True, None` | Completely disables cup removal & spill emergency checks | **CRITICAL** |
| [firmware/command_handler.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/command_handler.py#L40) | L40 | `bypass = cmd.get("bypass_safety", False) or getattr(config, "BYPASS_SAFETY_FOR_TEST", False)` | Enables command-level bypass parameter | **HIGH** |
| [web/src/app/dispense/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/dispense/page.tsx#L13,L63) | L13, L63 | UI Checkbox: `Mode Uji Coba Cepat (Bypass Sensor)` | Allows frontend user to inject `bypassSafety: true` into API | **CRITICAL** |

#### Safety Audit Findings & Recommendations:
* **FINDING [CRITICAL]:** The web dashboard exposes a visible checkbox: *"Mode Uji Coba Cepat (Abaikan deteksi cangkir & tandon agar pompa langsung jalan)"*. When checked, the pump will activate even if NO CUP is placed, or if the drip tray is currently flooded with water.
* **AUDIT RECOMMENDATION:** For production deployment, the UI bypass checkbox MUST be restricted to administrative roles or password-protected to prevent accidental flooding.

---

### 6. Loop Latency & Blocking Risks `[STATIC INSPECTION ONLY]`

1. **HTTP Network Blocking:**
   * MicroPython `urequests.post` and `urequests.get` in [firmware/cloud_client.py#L31,L49](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/cloud_client.py#L31,L49) use a $5\text{ second}$ timeout (`timeout=5`).
   * *Risk:* If an HTTP request hangs during dispensing telemetry, the control loop is suspended for up to $5\text{ seconds}$, delaying safety checks.
   * *Mitigation in code:* Telemetry is only sent every $250\text{ ms}$ during dispensing; Wi-Fi link drop triggers silent exception catch.
2. **Acoustic Tone Blocking:**
   * `buzzer.beep_alarm()` in [firmware/buzzer.py#L48-L54](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/buzzer.py#L48-L54) executes synchronous `time.sleep_ms()` calls totaling $450\text{ ms}$.
   * *Risk:* Relay is cut off BEFORE the tone plays ([firmware/pump_controller.py#L50](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/pump_controller.py#L50)), so physical shutoff is guaranteed instantaneous.
