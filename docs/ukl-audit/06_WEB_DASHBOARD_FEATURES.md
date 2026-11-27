# 06 — WEB DASHBOARD & USER INTERFACE AUDIT
## Smart Dispenser IoT — SMK Telkom Sidoarjo (Kelas XII SIJA 2)

**Audit Date:** 2026-11-26  
**Auditor:** Senior IoT, Embedded Systems & Cloud Security Auditor  
**Evidence Standard:** Strict Code-Backing (`[SOURCE CODE VERIFIED]`, `[STATIC INSPECTION ONLY]`, `[TEST LOG VERIFIED]`, `[DOCUMENTATION CLAIM ONLY]`, `[NOT VERIFIED]`, `[IMPLEMENTATION MISMATCH]`)

---

### 1. Implemented Web Routes & Components Directory `[SOURCE CODE VERIFIED]`

The Next.js 15 App Router contains 25 compiled routes across the following pages:

| URL Path | Main Responsibility | Implementation File | Backend Dependency | Firebase RTDB Dependency | Live Hardware Required? | Simulation Supported? |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **`/`** | Root redirect to `/dashboard` | [web/src/app/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/page.tsx) | None | No | No | No |
| **`/login`** | Student PIN authentication & NIS selection | [web/src/app/login/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/login/page.tsx) | `POST /api/auth/login` | No (In-memory Seed) | No | Yes |
| **`/dashboard`** | Student hydration summary & quick actions | [web/src/app/dashboard/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/dashboard/page.tsx) | `useDeviceTelemetry` | Yes (`devices/`, `dispensingLogs/`) | No (Fallback) | Yes |
| **`/monitoring`** | Live telemetry, physical sensors & AI health | [web/src/app/monitoring/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/monitoring/page.tsx) | `GET /api/device/telemetry` | Yes (`devices/dispenser01/`) | Recommended | Yes |
| **`/dispense`** | Precision water dispensing control panel | [web/src/app/dispense/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/dispense/page.tsx) | `POST /api/dispense/start` | Yes (`devices/dispenser01/commands`) | Yes (for real water) | Yes (`bypassSafety`) |
| **`/history`** | Dispensing transaction log viewer | [web/src/app/history/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/history/page.tsx) | Client RTDB listener | Yes (`dispensingLogs/`) | No | Yes |
| **`/leaderboard`** | Student hydration ranking & streak badges | [web/src/app/leaderboard/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/leaderboard/page.tsx) | Client RTDB listener | Yes (`dispensingLogs/`) | No | Yes |
| **`/ai-insights`** | AI safety classification audit & incident logs | [web/src/app/ai-insights/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/ai-insights/page.tsx) | Client RTDB listener | Yes (`violationEvents/`) | No | Yes |
| **`/settings`** | Threshold configuration review | [web/src/app/settings/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/settings/page.tsx) | None (Static View) | No | No | Yes |
| **`/setup`** | Diagnostics wizard & connectivity tests | [web/src/app/setup/page.tsx](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/setup/page.tsx) | `GET /api/setup/diagnostics` | Yes | No | Yes |

---

### 2. Feature-by-Feature Detailed Audit `[SOURCE CODE VERIFIED]`

#### A. Live Telemetry & Digital Clock (`/monitoring`)
* **Realtime Clock:** Implemented in `useDeviceTelemetry` via `setInterval(..., 1000)` and rendered in Navbar and status cards. Displays exact local time with second precision.
* **Connectivity Indicator:** Green pulsing dot indicating live connection. Shows elapsed seconds since `last_seen` timestamp (`Date.now() - val < 6000` evaluates online status).
* **Hardware Visualizers:**
  * Ultrasonic Cup: Displays distance in cm and badge (Cangkir Terdeteksi / Tidak Ada).
  * Reservoir Gauge: Progress bar showing percentage ($0 - 100\%$) and distance.
  * Drip Tray: Badge displaying ADC reading and status (Aman & Kering / Tergenang).

#### B. Precision Water Dispensing Control Panel (`/dispense`)
* **Dispense Presets Audit `[IMPLEMENTATION MISMATCH]`:**
  * Actual Presets in Code: **`50 ml`, `100 ml`, `200 ml`, `300 ml`** ([web/src/lib/constants.ts#L4](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/lib/constants.ts#L4)).
  * Discrepancy: Tutorial 08 documentation mentions `500 ml`, but code limits maximum to `300 ml` for glass size safety.
* **Dynamic Liquid Progress Bar:**
  * Permanent progress bar reflecting actual incoming flow meter pulses during dispensing.
  * Auto-rounds to $100\%$ on normal completion to account for the $5\text{ ml}$ cutoff offset.
* **Auto-Reset on Preset Selection:**
  * Clicking a different preset automatically fires `POST /api/dispense/reset` and zeroes the local progress bar to $0\text{ ml}$.
* **Manual Reset Button:**
  * Dedicated button `🔄 Reset 0 ml` enables instant clearing without page refresh.
* **Emergency Stop:**
  * Red button calling `POST /api/dispense/stop`, dispatching `STOP_DISPENSE` to the ESP32 command queue.
* **Safety Pre-Flight Checklist:**
  * Start button is disabled (`disabled={!canStart}`) unless:
    1. Cup is detected (`cup_distance_cm <= 10.0`),
    2. Tank is sufficient (`reservoir_percentage > 10`),
    3. Tray is dry (`spill_detected == false`),
    4. Pump is not already running.
  * Overridden only when `Mode Uji Coba Cepat (Bypass Sensor)` is checked.

#### C. Student Authentication & Protection (`/login`)
* **Seed Accounts:** 5 pre-configured student accounts in `REGISTERED_STUDENTS` with NIS `12022001` through `12022005` (Ahmad Fauzi, Bunga Citra, Dimas Pratama, Nabila Putri, Rizky Ramadhan).
* **PIN Security:** Default PIN `1234` hashed via SHA-256 (`03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4`).
* **Rate Limiter:** 5 consecutive failures triggers a **$60\text{ second}$** lockout window (`MAX_ATTEMPTS = 5`, `LOCKOUT_DURATION_MS = 60000`).

---

### 3. Missing or Unimplemented UI Features `[IMPLEMENTATION MISMATCH]`

1. **Custom Volume Slider / Input:**
   * Early project briefs proposed an arbitrary slider ($20 - 500\text{ ml}$).
   * Audit Finding: Only fixed presets (`[50, 100, 200, 300]`) are implemented in the UI to prevent overflow accidents.
2. **Dynamic Student Registration UI:**
   * There is no UI page for registering new students dynamically; users must be added to `REGISTERED_STUDENTS` in `web/src/lib/constants.ts`.
3. **Firmware OTA Update via Web:**
   * Mentioned as a potential future feature in early drafts, but **NOT IMPLEMENTED** in code.
