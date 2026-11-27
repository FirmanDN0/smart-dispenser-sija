# 05 — BACKEND, REST API & FIREBASE REALTIME DATABASE AUDIT
## Smart Dispenser IoT — SMK Telkom Sidoarjo (Kelas XII SIJA 2)

**Audit Date:** 2026-11-26  
**Auditor:** Senior IoT, Embedded Systems & Cloud Security Auditor  
**Evidence Standard:** Strict Code-Backing (`[SOURCE CODE VERIFIED]`, `[STATIC INSPECTION ONLY]`, `[TEST LOG VERIFIED]`, `[DOCUMENTATION CLAIM ONLY]`, `[NOT VERIFIED]`, `[IMPLEMENTATION MISMATCH]`)

---

### 1. End-to-End Communication Pipeline `[SOURCE CODE VERIFIED]`

The actual physical data path implemented in the code is:

$$\mathbf{ESP32} \xrightarrow[\text{urequests}]{\text{HTTPS REST (Port 443)}} \mathbf{Next.js\ 15\ (Vercel)} \xrightarrow[\text{Admin SDK}]{\text{HTTPS Persistent}} \mathbf{Firebase\ RTDB} \xrightarrow[\text{Client SDK}]{\text{WebSocket\ (WSS)}} \mathbf{Web\ Browser}$$

> **CRITICAL ARCHITECTURAL FINDING:**  
> The ESP32 **DOES NOT** connect directly to Firebase Realtime Database. It communicates via an intermediate secure REST API gateway provided by Next.js. Next.js validates hardware tokens, and only authenticated payloads are persisted to Firebase using the server-side Firebase Admin SDK.

---

### 2. Complete REST API Endpoint Directory `[SOURCE CODE VERIFIED]`

| Method | Endpoint Route | Request Auth | Request Payload Format | Response Schema | Database / In-Memory Operation | Source File Reference |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **`POST`** | `/api/device/telemetry` | `X-Device-Token` | `{ deviceId, timestamp, telemetry: {...} }` | `{ success: true, timestamp }` | Writes to `devices/{id}/telemetry/latest` and `devices/{id}/state` | [web/src/app/api/device/telemetry/route.ts#L72](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/device/telemetry/route.ts#L72) |
| **`GET`** | `/api/device/telemetry` | None (Public) | None | `{ telemetry, state, source, serverTime }` | Reads latest telemetry from Firebase or in-memory fallback | [web/src/app/api/device/telemetry/route.ts#L37](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/device/telemetry/route.ts#L37) |
| **`GET`** | `/api/device/commands` | `X-Device-Token` | Query: `?deviceId=dispenser01` | `{ deviceId, commands: [...], timestamp }` | Queries `devices/{id}/commands` where `status == PENDING`, marks `DISPATCHED` | [web/src/app/api/device/commands/route.ts#L6](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/device/commands/route.ts#L6) |
| **`POST`** | `/api/device/ack` | `X-Device-Token` | `{ deviceId, commandId, status, actualVolumeMl, durationMs }` | `{ success: true, timestamp }` | Updates command status and appends entry to `dispensingLogs/{logId}` | [web/src/app/api/device/ack/route.ts#L17](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/device/ack/route.ts#L17) |
| **`POST`** | `/api/device/events` | `X-Device-Token` | `{ deviceId, events: [ { type, severity, description, ... } ] }` | `{ success: true, count, timestamp }` | Appends incident record to `violationEvents/{eventId}` | [web/src/app/api/device/events/route.ts#L21](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/device/events/route.ts#L21) |
| **`POST`** | `/api/dispense/start` | Student Session | `{ volumeMl: number, bypassSafety?: boolean }` | `{ success: true, commandId, message }` | Inserts new command with status `PENDING` into Firebase and memory | [web/src/app/api/dispense/start/route.ts#L14](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/dispense/start/route.ts#L14) |
| **`POST`** | `/api/dispense/stop` | Student Session | None | `{ success: true, commandId, message }` | Dispatches emergency `STOP_DISPENSE` command to queue | [web/src/app/api/dispense/stop/route.ts#L12](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/dispense/stop/route.ts#L12) |
| **`POST`** | `/api/dispense/reset` | None | None | `{ success: true, message, timestamp }` | Resets in-memory session volume and pulse counters to $0\text{ ml}$ | [web/src/app/api/dispense/reset/route.ts#L4](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/dispense/reset/route.ts#L4) |
| **`POST`** | `/api/auth/login` | None | `{ studentId: string, pin: string }` | `{ success: true, student }` (Sets cookie) | Validates PIN against SHA-256 hash, enforces 5-attempt rate limit | [web/src/app/api/auth/login/route.ts#L10](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/auth/login/route.ts#L10) |
| **`POST`** | `/api/auth/logout` | None | None | `{ success: true }` | Clears `sija_session` HTTP-Only cookie | [web/src/app/api/auth/logout/route.ts#L4](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/auth/logout/route.ts#L4) |
| **`GET`** | `/api/auth/me` | Student Session | None | `{ authenticated: bool, student }` | Decodes HMAC-signed session cookie | [web/src/app/api/auth/me/route.ts#L6](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/auth/me/route.ts#L6) |
| **`GET`** | `/api/setup/diagnostics`| None | None | `{ checks: {...}, overallReady }` | Validates environment variables, Firebase Admin, and memory store | [web/src/app/api/setup/diagnostics/route.ts#L7](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/setup/diagnostics/route.ts#L7) |
| **`POST`** | `/api/simulation/telemetry`| None | Partial telemetry body | `{ success: true, telemetry }` | Allows manual injection of simulated sensor values | [web/src/app/api/simulation/telemetry/route.ts#L5](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/app/api/simulation/telemetry/route.ts#L5) |

---

### 3. Cryptographic Security & Credential Protection Audit `[SOURCE CODE VERIFIED]`

1. **Hardware Authentication (`X-Device-Token`):**
   * Implemented in [web/src/lib/device-auth.ts#L9-L38](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/lib/device-auth.ts#L9-L38).
   * Calculates SHA-256 hash of incoming raw token:
     ```typescript
     const calculatedHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
     ```
   * Verifies against `DEVICE_TOKEN_SHA256` using:
     ```typescript
     crypto.timingSafeEqual(bufA, bufB);
     ```
     *(Eliminates timing attack vulnerabilities).*
2. **Fallback Token Hash in Code:**
   * Line 19 contains a hardcoded fallback hash:
     `03ff1e2465f3e6d9030703ff2b76b936221ccdb169bde59e3364f7e6d8f83cbd`  
     *(Matches token: `[REDACTED]`)*.
3. **Credential Redaction Audit:**
   * All production Firebase Admin Private Keys, client API keys, and device tokens in `.env.local` and `secrets.py` are git-ignored and classified as **`[REDACTED]`**.

---

### 4. Actual Firebase Realtime Database Hierarchy `[SOURCE CODE VERIFIED]`

The database schema extracted from codebase operations comprises the following nodes:

```
https://[FIREBASE_PROJECT_ID]-default-rtdb.asia-southeast1.firebasedatabase.app/
│
├── devices/
│   └── dispenser01/
│       ├── state/
│       │   ├── is_online: boolean
│       │   ├── status: "IDLE" | "DISPENSING" | "EMERGENCY_STOP"
│       │   ├── wifi_rssi: number (-60)
│       │   └── ip_address: string ("10.218.16.54")
│       │
│       ├── telemetry/
│       │   └── latest/
│       │       ├── cup_distance_cm: float
│       │       ├── cup_detected: boolean
│       │       ├── reservoir_percentage: float
│       │       ├── tray_adc: integer
│       │       ├── spill_detected: boolean
│       │       ├── flow_pulses: integer
│       │       ├── measured_volume_ml: float
│       │       ├── pump_running: boolean
│       │       ├── ai_classification: string
│       │       ├── ai_risk_level: string
│       │       ├── ai_explanation: string
│       │       └── timestamp: integer (epoch ms)
│       │
│       ├── commands/
│       │   └── [commandId]/
│       │       ├── action: "START_DISPENSE" | "STOP_DISPENSE"
│       │       ├── volume_ml: integer (50, 100, 200, 300)
│       │       ├── bypass_safety: boolean
│       │       ├── user_id: string
│       │       ├── user_name: string
│       │       ├── status: "PENDING" | "DISPATCHED" | "ACKNOWLEDGED" | "RUNNING" | "COMPLETED" | "FAILED"
│       │       ├── created_at: integer
│       │       └── expires_at: integer
│       │
│       └── acknowledgments/
│           └── [commandId]/
│               ├── status: string
│               ├── actual_volume_ml: float
│               ├── duration_ms: integer
│               └── timestamp: integer
│
├── dispensingLogs/
│   └── [logId]/
│       ├── id: string ("log_1732612345_abc")
│       ├── device_id: string ("dispenser01")
│       ├── user_id: string ("student_01")
│       ├── student_name: string ("Ahmad Fauzi")
│       ├── requested_volume_ml: integer
│       ├── measured_volume_ml: float
│       ├── duration_ms: integer
│       ├── status: "COMPLETED" | "FAILED"
│       └── timestamp: integer
│
└── violationEvents/
    └── [eventId]/
        ├── id: string ("viol_1732612345_xyz")
        ├── device_id: string ("dispenser01")
        ├── user_id: string | null
        ├── type: "CUP_REMOVED_DURING_FILL" | "TRAY_SPILL_DETECTED" | "NO_FLOW_BLOCKAGE"
        ├── severity: "HIGH" | "CRITICAL"
        ├── description: string
        ├── sensor_snapshot: object
        └── timestamp: integer
```

---

### 5. ERD vs. Implementation Mismatch Table `[IMPLEMENTATION MISMATCH]`

Vocational reports often draft relational ERDs (tables with foreign keys) that do not match the real NoSQL document tree:

| Theoretical ERD Entity in Report Drafts | Real Implementation in Code | Discrepancy & Technical Explanation |
| :--- | :--- | :--- |
| **`Tabel Siswa` (Relational Table)** | Static Array [constants.ts#L17](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/web/src/lib/constants.ts#L17) | **Not in Database:** Student credentials and daily goals are loaded in-memory from a static TypeScript seed file, not stored in Firebase tables. |
| **`Tabel Dispenser` (Relational Table)** | JSON Node: `/devices/dispenser01` | **NoSQL Document Node:** Dispenser status is a single nested JSON object, not a relational table row. |
| **`Tabel Telemetri` (Time-series Table)** | Single Latest Key: `/telemetry/latest` | **No Time-Series Telemetry Table:** Historical sensor telemetry is overwritten on every cycle to conserve Firebase bandwidth; only the latest state is retained. |
| **`Tabel Transaksi / Dispensing`** | Document Node: `/dispensingLogs` | Matches closely: historical dispensing events are appended as unique push IDs under `dispensingLogs`. |
| **`Tabel Insiden / Maintenance`** | Document Node: `/violationEvents` | Implemented as flat violation event records triggered by safety controller interlocks. |
