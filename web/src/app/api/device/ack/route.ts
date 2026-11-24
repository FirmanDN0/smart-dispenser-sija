import { NextRequest, NextResponse } from "next/server";
import { validateDeviceToken } from "@/lib/device-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { getSimulationStore } from "@/lib/simulation";
import { z } from "zod";

const ackSchema = z.object({
  deviceId: z.string().min(1),
  commandId: z.string().min(1),
  status: z.enum(["ACKNOWLEDGED", "RUNNING", "COMPLETED", "REJECTED", "FAILED"]),
  actualVolumeMl: z.number().default(0),
  durationMs: z.number().default(0),
  message: z.string().default(""),
  timestamp: z.number().optional(),
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
    const parsed = ackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Skema acknowledgment tidak valid", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { deviceId, commandId, status, actualVolumeMl, durationMs, message } = parsed.data;
    const now = Date.now();

    const ackData = {
      command_id: commandId,
      device_id: deviceId,
      status,
      actual_volume_ml: actualVolumeMl,
      duration_ms: durationMs,
      message,
      timestamp: now,
    };

    const { db, isConfigured } = getFirebaseAdmin();
    if (isConfigured && db) {
      const updates: Record<string, unknown> = {};
      updates[`devices/${deviceId}/acknowledgments/${commandId}`] = ackData;
      updates[`devices/${deviceId}/commands/${commandId}/status`] = status;

      // When completed, record into historical dispensingLogs
      if (status === "COMPLETED" || status === "FAILED") {
        const cmdSnap = await db.ref(`devices/${deviceId}/commands/${commandId}`).once("value");
        const cmd = cmdSnap.val();
        if (cmd) {
          const logId = `log_${now}_${commandId.slice(0, 6)}`;
          updates[`dispensingLogs/${logId}`] = {
            id: logId,
            device_id: deviceId,
            user_id: cmd.user_id,
            student_name: cmd.user_name || "Siswa SIJA",
            requested_volume_ml: cmd.volume_ml,
            measured_volume_ml: actualVolumeMl,
            duration_ms: durationMs,
            status: status === "COMPLETED" ? "COMPLETED" : "FAILED",
            timestamp: now,
          };
        }
      }

      await db.ref().update(updates);
    } else {
      // In-memory simulation store update
      const simStore = getSimulationStore();
      if (simStore.commands[commandId]) {
        simStore.commands[commandId].status = status;
      }
    }

    return NextResponse.json({ success: true, timestamp: now });
  } catch (error) {
    console.error("[Ack Error]:", error);
    return NextResponse.json({ error: "Gagal memproses acknowledgment" }, { status: 500 });
  }
}
