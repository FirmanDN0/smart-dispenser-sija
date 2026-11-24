import { NextRequest, NextResponse } from "next/server";
import { validateDeviceToken } from "@/lib/device-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { getSimulationStore } from "@/lib/simulation";
import { z } from "zod";

const eventsSchema = z.object({
  deviceId: z.string().min(1),
  events: z.array(
    z.object({
      type: z.enum(["CUP_REMOVED_DURING_FILL", "TRAY_SPILL_DETECTED", "NO_FLOW_BLOCKAGE"]),
      severity: z.enum(["HIGH", "CRITICAL"]),
      description: z.string(),
      sensor_snapshot: z.record(z.unknown()).optional(),
      user_id: z.string().nullable().optional(),
      timestamp: z.number().optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  const rawToken = request.headers.get("X-Device-Token");
  if (!validateDeviceToken(rawToken)) {
    return NextResponse.json(
      { error: "Unauthorized: Token otentikasi perangkat tidak valid." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = eventsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Skema event tidak valid", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { deviceId, events } = parsed.data;
    const now = Date.now();
    const { db, isConfigured } = getFirebaseAdmin();

    for (const ev of events) {
      const eventId = `viol_${now}_${Math.random().toString(36).substring(2, 7)}`;
      const record = {
        id: eventId,
        device_id: deviceId,
        user_id: ev.user_id || null,
        type: ev.type,
        severity: ev.severity,
        description: ev.description,
        sensor_snapshot: ev.sensor_snapshot || {},
        timestamp: ev.timestamp ? Math.round(ev.timestamp * 1000) : now,
      };

      if (isConfigured && db) {
        await db.ref(`violationEvents/${eventId}`).set(record);
      } else {
        getSimulationStore().violations.unshift(record);
      }
    }

    return NextResponse.json({ success: true, processedCount: events.length });
  } catch (error) {
    console.error("[Events Ingestion Error]:", error);
    return NextResponse.json({ error: "Gagal mencatat event pelanggaran" }, { status: 500 });
  }
}
