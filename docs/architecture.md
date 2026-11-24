# ARSITEKTUR SISTEM IOT CLOUD — SMART DISPENSER
## Grade XII SIJA UKL 3 — SMK Telkom Sidoarjo

```text
+-----------------------------------------------------------------------------------+
|                            LAPISAN FISIK (HARDWARE)                               |
|                                                                                   |
|  [HC-SR04 Gelas]      [HC-SR04 Tandon]      [YF-S201 Flow]     [Spill Sensor ADC] |
|     (GPIO 13/14)        (GPIO 16/17)          (GPIO 27)            (GPIO 34)      |
|          \                   |                    |                    /          |
|           +------------------+--------------------+-------------------+           |
|                                      |                                            |
|                                      v                                            |
|                       +------------------------------+                            |
|                       |   ESP32 DEVKIT V1 (30 PIN)   |                            |
|                       |   MicroPython Firmware       |                            |
|                       |                              |                            |
|                       |  - Local Safety Interlock    |                            |
|                       |  - Rule-Based AI Engine      |                            |
|                       |  - Flow Meter Pulse Counter  |                            |
|                       |  - Non-blocking Event Loop   |                            |
|                       +------------------------------+                            |
|                             /                  \                                  |
|                            v                    v                                 |
|                   [Relay 5V -> Pompa]    [Passive Buzzer PWM]                     |
|                        (GPIO 26)              (GPIO 25)                           |
+-----------------------------------------------------------------------------------+
                                      |
                           Wi-Fi (HTTPS / REST API)
                       X-Device-Token Auth Header
                                      |
                                      v
+-----------------------------------------------------------------------------------+
|                        LAPISAN GATEWAY API (NEXT.JS)                              |
|                                                                                   |
|   POST /api/device/telemetry  <-- Ingest sensor readings & AI inference           |
|   GET  /api/device/commands   <-- Polling pending dispense commands               |
|   POST /api/device/ack        <-- Receive command execution confirmations         |
|   POST /api/device/events     <-- Deduplicated safety violation events            |
|                                                                                   |
|   POST /api/dispense/start    <-- Authenticated student dispensing request        |
|   POST /api/dispense/stop     <-- Emergency manual cutoff                         |
|   POST /api/auth/login        <-- Server-side PIN verification & session cookie   |
+-----------------------------------------------------------------------------------+
                                      |
                           Firebase Admin SDK (Node.js)
                                      |
                                      v
+-----------------------------------------------------------------------------------+
|                   LAPISAN CLOUD (FIREBASE REALTIME DATABASE)                      |
|                                                                                   |
|   /devices/dispenser01/telemetry/latest                                           |
|   /devices/dispenser01/state                                                      |
|   /devices/dispenser01/commands                                                   |
|   /devices/dispenser01/acknowledgments                                            |
|   /users/$userId/profile & settings                                               |
|   /dispensingLogs/$logId                                                          |
|   /violationEvents/$eventId                                                       |
|   /aiResults/$eventId                                                             |
+-----------------------------------------------------------------------------------+
                                      ^
                                      | Firebase Web SDK
                                      | Realtime WebSocket Listeners (onValue)
                                      v
+-----------------------------------------------------------------------------------+
|                       LAPISAN PENGGUNA (WEB DASHBOARD)                            |
|                                                                                   |
|   - Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS (Antislop UI)    |
|   - Antarmuka Siswa: Login PIN, Dashboard Hidrasi, Presets Dispense 50-300 ml     |
|   - Pemantauan Sensor Realtime, AI Insights, Riwayat, Leaderboard                 |
|   - Panel Diagnostik Setup Lab Mandiri                                            |
+-----------------------------------------------------------------------------------+
```
