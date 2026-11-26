import { NextRequest, NextResponse } from "next/server";
import { validateDeviceToken } from "@/lib/device-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { updateSimulatedTelemetry, getSimulationStore } from "@/lib/simulation";
import { z } from "zod";

const telemetrySchema = z.object({
  deviceId: z.string().min(1),
  timestamp: z.number().optional(),
  telemetry: z.object({
    cup_distance_cm: z.number(),
    cup_detected: z.boolean(),
    reservoir_distance_cm: z.number(),
    reservoir_percentage: z.number(),
    tray_adc: z.number(),
    spill_detected: z.boolean(),
    flow_pulses: z.number(),
    measured_volume_ml: z.number(),
    pump_running: z.boolean(),
    buzzer_active: z.boolean().optional(),
    ai_classification: z.enum([
      "AMAN",
      "GELAS_TIDAK_ADA",
      "AIR_RENDAH",
      "TUMPAHAN",
      "ALIRAN_BERMASALAH",
      "SENSOR_ERROR",
    ]),
    ai_risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    ai_explanation: z.string().optional(),
    wifi_rssi: z.number().optional(),
    ip_address: z.string().optional(),
  }),
});

// GET endpoint so the frontend dashboard can retrieve the latest telemetry directly from server
export async function GET() {
  const { db, isConfigured } = getFirebaseAdmin();
  if (isConfigured && db) {
    try {
      const snap = await db.ref("devices/dispenser01/telemetry/latest").once("value");
      const val = snap.val();
      if (val) {
        const stateSnap = await db.ref("devices/dispenser01/state").once("value");
        return NextResponse.json({
          telemetry: val,
          state: stateSnap.val() || null,
          source: "firebase",
        });
      }
    } catch (e) {
      console.warn("[Telemetry GET Error]:", e);
    }
  }

  // Fallback to in-memory store (which receives POST from ESP32)
  const sim = getSimulationStore();
  const now = Date.now();
  const isOnline = sim.state.last_seen ? (now - sim.state.last_seen < 5000) : false;
  return NextResponse.json({
    telemetry: sim.telemetry,
    state: {
      ...sim.state,
      is_online: isOnline,
    },
    source: "server_memory",
    serverTime: now,
    lastSeen: sim.state.last_seen || null,
  });
}

export async function POST(request: NextRequest) {
  // 1. Authenticate Hardware Device
  const rawToken = request.headers.get("X-Device-Token");
  if (!validateDeviceToken(rawToken)) {
    return NextResponse.json(
      { error: "Unauthorized: Token otentikasi perangkat tidak valid." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = telemetrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Skema telemetri tidak valid", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { deviceId, telemetry } = parsed.data;
    const now = Date.now();

    const telemetryRecord = {
      ...telemetry,
      timestamp: now,
    };

    // Keep in-memory store updated for immediate web dashboard updates
    updateSimulatedTelemetry(telemetryRecord);

    // 2. Persist to Firebase Realtime Database if Admin SDK is configured
    const { db, isConfigured } = getFirebaseAdmin();
    if (isConfigured && db) {
      const updates: Record<string, unknown> = {};
      updates[`devices/${deviceId}/telemetry/latest`] = telemetryRecord;
      updates[`devices/${deviceId}/lastSeen`] = now;
      updates[`devices/${deviceId}/state/is_online`] = true;
      updates[`devices/${deviceId}/state/wifi_rssi`] = telemetry.wifi_rssi ?? -60;
      updates[`devices/${deviceId}/state/ip_address`] = telemetry.ip_address ?? "0.0.0.0";
      updates[`devices/${deviceId}/state/status`] = telemetry.pump_running
        ? "DISPENSING"
        : telemetry.spill_detected
        ? "EMERGENCY_STOP"
        : "IDLE";

      await db.ref().update(updates);
    }

    return NextResponse.json({ success: true, timestamp: now });
  } catch (error) {
    console.error("[Telemetry Ingest Error]:", error);
    return NextResponse.json({ error: "Gagal menyimpan telemetri." }, { status: 500 });
  }
}
