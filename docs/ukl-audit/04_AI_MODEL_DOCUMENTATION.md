# 04 — EXPLAINABLE EDGE AI MODEL AUDIT
## Model: SmartDispenser-RuleAI-v1

**Audit Date:** 2026-11-26  
**Auditor:** Senior IoT, Embedded Systems & Cloud Security Auditor  
**Evidence Standard:** Strict Code-Backing (`[SOURCE CODE VERIFIED]`, `[STATIC INSPECTION ONLY]`, `[TEST LOG VERIFIED]`, `[DOCUMENTATION CLAIM ONLY]`, `[NOT VERIFIED]`, `[IMPLEMENTATION MISMATCH]`)

---

### 1. Model Identity & Paradigm `[SOURCE CODE VERIFIED]`

Extracted from [ai/model_config.json#L1-L5](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/ai/model_config.json#L1-L5):
* **Model Identifier:** `SmartDispenser-RuleAI-v1`
* **Version:** `1.0.0`
* **Architectural Paradigm:** **Explainable Edge AI (XAI) — Deterministic Hierarchical Expert Rule-Based Classifier**
* **Target Runtime:** MicroPython on ESP32 (Tensilica Xtensa LX6, $\approx 520\text{ KB}$ SRAM)
* **Author / Provenance:** SMK Telkom Sidoarjo — XII SIJA UKL 3

> **CRITICAL CLARIFICATION FOR UKL REPORT:**  
> The system **DOES NOT** use a Deep Neural Network (DNN), Convolutional Neural Network (CNN), or Large Language Model (LLM). It is an **Explainable Rule-Based Expert System** running deterministically at the edge to ensure real-time safety and zero hallucination.

---

### 2. Feature Vector Audit (9 Expected Inputs) `[SOURCE CODE VERIFIED]`

The audit evaluated how the 9 theoretical inputs specified in [ai/model_config.json#L6-L16](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/ai/model_config.json#L6-L16) are actually utilized in [firmware/ai_classifier.py#L27-L77](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L27-L77):

| Feature Name | Input Type | Ingested in Signature? | Actually Evaluated in Rules? | Branch Usage Reference | Audit Finding |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `sensor_validity` | `bool` | Yes (`L27`) | **Yes** | Rule 1 (`L38`) | Evaluates ultrasonic echo hardware timeout / electrical faults |
| `cup_distance_cm` | `float` | Yes (`L28`) | **Yes** | Rule 1 (`L38`), Rule 3 (`L52`), Rule 6 (`L70`) | Range boundary and display formatting |
| `reservoir_distance_cm` | `float` | Yes (`L29`) | **Yes** | Rule 1 (`L38`) | Boundary validity ($0 - 200\text{ cm}$) |
| `reservoir_percentage` | `float` | Yes (`L30`) | **Yes** | Rule 5 (`L62`) | Low water threshold trigger ($\le 20.0\%$) |
| `tray_adc` | `int` | Yes (`L31`) | **Yes** | Rule 2 (`L44`) | Drip tray spill threshold ($\ge 1200$) |
| `cup_detected` | `bool` | Yes (`L32`) | **Yes** | Rule 3 (`L50`), Rule 6 (`L68`) | Presence flag for active/idle safety gating |
| `pump_running` | `bool` | Yes (`L33`) | **Yes** | Rule 3 (`L50`), Rule 4 (`L56`), Rule 6 (`L68`) | Distinguishes idle standby from active dispensing |
| `flow_pulses` | `int` | Yes (`L34`) | **NO** | *Unused in conditional branches* | **`[IMPLEMENTATION MISMATCH]`** Read into variable `flow_pulses` but not tested; blockage is evaluated via `no_flow_duration_ms`. |
| `no_flow_duration_ms` | `int` | Yes (`L35`) | **Yes** | Rule 4 (`L56`) | Evaluates blockage timeout ($> 5000\text{ ms}$) |

---

### 3. Hierarchical Classification Rules & Priority Ordering `[SOURCE CODE VERIFIED]`

Evaluated sequentially in [firmware/ai_classifier.py#L37-L78](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L37-L78):

| Priority | Evaluation Condition | Output Class | Risk Level | Explanation String | Action Code | Source Line |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: |
| **1** | `not valid or cup_cm < 0 or res_cm < 0 or cup_cm > 200 or res_cm > 200` | **`SENSOR_ERROR`** | `HIGH` | "Sensor ultrasonik atau ADC membaca nilai di luar batas fisik valid." | `HALT_SYSTEM_CHECK_WIRING` | [ai_classifier.py#L38-L41](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L38-L41) |
| **2** | `tray_adc >= config.SPILL_THRESHOLD_ADC` ($1200$) | **`TUMPAHAN`** | `CRITICAL` | f"Baki tetesan mendeteksi tumpahan air (ADC {tray_adc} >= {config.SPILL_THRESHOLD_ADC})." | `EMERGENCY_SHUTDOWN_PUMP_BUZZER_ALARM` | [ai_classifier.py#L44-L47](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L44-L47) |
| **3** | `pump_on and not cup_det` | **`GELAS_TIDAK_ADA`** | `CRITICAL` | f"Cangkir terlepas saat pompa menyala (jarak {cup_cm} cm > {config.CUP_DETECTED_MAX_CM} cm)." | `EMERGENCY_SHUTDOWN_PUMP_LOG_VIOLATION` | [ai_classifier.py#L50-L53](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L50-L53) |
| **4** | `pump_on and no_flow_ms > config.FLOW_NO_PULSE_TIMEOUT_MS` ($5000$) | **`ALIRAN_BERMASALAH`** | `HIGH` | f"Pompa menyala tetapi tidak ada aliran air terdeteksi selama {no_flow_ms} ms." | `STOP_PUMP_CHECK_BLOCKAGE` | [ai_classifier.py#L56-L59](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L56-L59) |
| **5** | `res_pct <= config.RESERVOIR_LOW_THRESHOLD_PCT` ($20.0\%$) | **`AIR_RENDAH`** | `MEDIUM` | f"Level tandon air rendah ({res_pct:.1f}% <= {config.RESERVOIR_LOW_THRESHOLD_PCT}%)." | `DISABLE_DISPENSE_PROMPT_REFILL` | [ai_classifier.py#L62-L65](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L62-L65) |
| **6** | `not cup_det and not pump_on` | **`GELAS_TIDAK_ADA`** | `LOW` | f"Dispenser siaga menunggu cangkir diletakkan (jarak {cup_cm} cm)." | `STANDBY_WAIT_FOR_CUP` | [ai_classifier.py#L68-L71](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L68-L71) |
| **7** | *Default Fallback* | **`AMAN`** | `LOW` | "Kondisi dispenser normal. Cangkir terpasang, level air mencukupi, baki kering." | `READY_FOR_DISPENSE` | [ai_classifier.py#L74-L77](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L74-L77) |

---

### 4. Integration & Explainability Verification `[SOURCE CODE VERIFIED]`

1. **State Update:** Internal model state variables `self.last_classification`, `self.last_risk_level`, and `self.last_explanation` are updated upon every cycle ([firmware/ai_classifier.py#L79-L81](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/ai_classifier.py#L79-L81)).
2. **Action Strings:**
   * Action codes (e.g., `EMERGENCY_SHUTDOWN_PUMP_BUZZER_ALARM`) are returned as diagnostic strings. Physical relay actions are enforced separately by [firmware/safety_controller.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/safety_controller.py).
3. **Cloud Telemetry Transmission:**
   * Classification output is packaged into `telemetry_payload`:
     ```python
     "ai_classification": ai_class,
     "ai_risk_level": ai_risk,
     "ai_explanation": ai_exp
     ```
     ([firmware/main.py#L185-L187](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/firmware/main.py#L185-L187)).
4. **Web Dashboard Display:**
   * Displayed live on `/monitoring` and `/ai-insights` via [web/src/app/monitoring/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/monitoring/page.tsx) and [web/src/app/ai-insights/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/ai-insights/page.tsx).

---

### 5. Evaluation Dataset & Benchmark Audit `[SOURCE CODE VERIFIED]`

The offline validation engine is implemented in [ai/evaluation.py](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/ai/evaluation.py):

* **Evaluation Dataset:** [ai/dataset_simulated.csv](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/ai/dataset_simulated.csv) containing **23 labeled ground-truth instances**.
* **Distribution of Test Classes:**
  * `AMAN`: 6 samples
  * `GELAS_TIDAK_ADA`: 4 samples
  * `AIR_RENDAH`: 4 samples
  * `TUMPAHAN`: 4 samples
  * `ALIRAN_BERMASALAH`: 3 samples
  * `SENSOR_ERROR`: 3 samples
* **Performance on Synthetic Test Set:**
  * Classification Accuracy: **$100.0\%$**
  * Macro-Averaged Precision: **$1.000$**
  * Macro-Averaged Recall: **$1.000$**
  * Macro-Averaged F1-Score: **$1.000$**
  * Confusion Matrix: Diagonal with $0$ off-diagonal misclassifications.
* **Audit Limitation:**
  * The file [ai/dataset_actual_template.csv](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/ai/dataset_actual_template.csv) is only an empty template header. Real physical telemetry traces have not been aggregated into a formalized physical benchmark CSV.
