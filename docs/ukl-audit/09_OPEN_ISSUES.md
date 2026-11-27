# 09 — OPEN ISSUES & RISK AUDIT REGISTER
## Smart Dispenser IoT — SMK Telkom Sidoarjo (Kelas XII SIJA 2)

**Audit Date:** 2026-11-26  
**Auditor:** Senior IoT, Embedded Systems & Cloud Security Auditor  
**Evidence Standard:** Strict Code-Backing (`[SOURCE CODE VERIFIED]`, `[STATIC INSPECTION ONLY]`, `[TEST LOG VERIFIED]`, `[DOCUMENTATION CLAIM ONLY]`, `[NOT VERIFIED]`, `[IMPLEMENTATION MISMATCH]`)

---

### Priority Risk Assessment Summary

| Issue ID | Risk Classification | Affected Subsystem | Summary of Finding | Resolution Status |
| :---: | :---: | :--- | :--- | :---: |
| **ISSUE-01** | **CRITICAL** | Web UI / Safety | Unrestricted Frontend Safety Bypass Checkbox | Open |
| **ISSUE-02** | **HIGH** | Firmware Network | Synchronous HTTP Request Timeout can delay 30ms Control Loop | Open (Mitigated) |
| **ISSUE-03** | **HIGH** | Firmware AI | Flow Pulses Parameter is Read but Unused in AI Rule Branches | Open |
| **ISSUE-04** | **MEDIUM** | Firmware Hardware | Synchronous Buzzer Tones Block Execution Loop during Alarm | Open |
| **ISSUE-05** | **MEDIUM** | Validation Data | Missing Formal Empirical Fluid Measurement Datalog CSV | Open |
| **ISSUE-06** | **LOW** | Web Architecture | Hardcoded Single Device ID `dispenser01` in API Handlers | Open |

---

### Detailed Open Issue Breakdown

#### ISSUE-01 [CRITICAL]: Unrestricted Frontend Safety Bypass Checkbox
* **Subsystem:** Frontend User Interface & API Dispatcher
* **Code Location:** [web/src/app/dispense/page.tsx#L13,L63](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/dispense/page.tsx#L13,L63) and [firmware/safety_controller.py#L26-L27](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/safety_controller.py#L26-L27).
* **Technical Description:**  
  The web dashboard provides a visible checkbox: *"Mode Uji Coba Cepat (Abaikan deteksi cangkir & tandon agar pompa langsung jalan)"*. When checked, the web sends `bypassSafety: true` to the backend, which forwards it to the ESP32. In `SafetyController.check_safety_and_enforce()`, if `bypass_safety` is true, the method returns `True, None` immediately, completely bypassing cup detection and spill detection.
* **Potential Consequence:**  
  Any student or user can accidentally or maliciously start the pump without a cup in place, causing continuous water flooding onto the electrical components.
* **Recommended Mitigation:**  
  Require administrator credentials or hide the bypass checkbox behind an authenticated `/setup` debug mode.

---

#### ISSUE-02 [HIGH]: Synchronous HTTP Timeout in Control Loop
* **Subsystem:** MicroPython Network Client
* **Code Location:** [firmware/cloud_client.py#L31,L49](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/cloud_client.py#L31,L49).
* **Technical Description:**  
  Calls to `urequests.post` and `urequests.get` use `timeout=5`. If the Wi-Fi gateway or Vercel server becomes unresponsive during active dispensing, the thread blocks for up to $5000\text{ ms}$.
* **Potential Consequence:**  
  During the 5-second freeze, safety checks and pulse updates cannot run, potentially delaying pump shutoff.
* **Recommended Mitigation:**  
  Reduce the HTTP timeout during dispensing to $1000\text{ ms}$ or utilize non-blocking raw socket streams (`select.poll()`).

---

#### ISSUE-03 [HIGH]: Parameter `flow_pulses` Ingested but Unused in AI Classifier
* **Subsystem:** Explainable Edge AI Engine
* **Code Location:** [firmware/ai_classifier.py#L34,L56](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L34,L56).
* **Technical Description:**  
  The method `classify(sensor_data)` unpacks `flow_pulses = sensor_data.get("flow_pulses", 0)`, but none of the 7 conditional rules evaluate `flow_pulses`. Flow blockage is instead evaluated solely through `no_flow_ms > config.FLOW_NO_PULSE_TIMEOUT_MS`.
* **Potential Consequence:**  
  Creates a mismatch with the model specification in [ai/model_config.json#L12](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/ai/model_config.json#L12), which declares `flow_pulses` as an active classification feature.
* **Recommended Mitigation:**  
  Update `model_config.json` documentation to reflect that `no_flow_duration_ms` is the active feature, or incorporate pulse rate validation into Rule 4.

---

#### ISSUE-04 [MEDIUM]: Synchronous Buzzer Tones Block Execution Loop
* **Subsystem:** Hardware Actuators
* **Code Location:** [firmware/buzzer.py#L48-L54](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/buzzer.py#L48-L54).
* **Technical Description:**  
  The emergency alarm tone method `beep_alarm()` utilizes synchronous `time.sleep_ms()` calls totaling $450\text{ ms}$.
* **Potential Consequence:**  
  While the relay is turned off *before* the alarm sounds, the execution loop is paused for nearly half a second while the sound pattern completes.
* **Recommended Mitigation:**  
  Implement a timer-based non-blocking buzzer state machine using `time.ticks_ms()`.

---

#### ISSUE-05 [MEDIUM]: Missing Physical Calibration Datalog
* **Subsystem:** Quality Assurance & Verification
* **Code Location:** [ai/dataset_actual_template.csv](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/ai/dataset_actual_template.csv).
* **Technical Description:**  
  While synthetic offline validation is complete (23 samples in `dataset_simulated.csv`), physical calibration was tuned interactively without saving a permanent, multi-trial empirical measurement dataset.
* **Potential Consequence:**  
  Lack of a verifiable experimental error table for the UKL 3 examination report (Bab V).
* **Recommended Mitigation:**  
  Conduct 10 physical test runs with a measuring cup and populate `dataset_actual_template.csv`.

---

#### ISSUE-06 [LOW]: Hardcoded Device ID `dispenser01`
* **Subsystem:** Cloud Backend & Routing
* **Code Location:** [web/src/app/api/device/telemetry/route.ts#L41](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/device/telemetry/route.ts#L41).
* **Technical Description:**  
  Several API handlers default directly to device identifier `dispenser01`.
* **Potential Consequence:**  
  Limits multi-device deployment in a campus network.
* **Recommended Mitigation:**  
  Extract device ID dynamically from request headers or query parameters across all endpoints.
