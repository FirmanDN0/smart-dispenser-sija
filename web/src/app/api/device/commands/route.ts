import { NextRequest, NextResponse } from "next/server";
import { validateDeviceToken } from "@/lib/device-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { getSimulationStore } from "@/lib/simulation";

export async function GET(request: NextRequest) {
  // Validate Device Token
  const rawToken = request.headers.get("X-Device-Token");
  if (!validateDeviceToken(rawToken)) {
    return NextResponse.json(
      { error: "Unauthorized: Token otentikasi perangkat tidak valid." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId") || "dispenser01";

  const { db, isConfigured } = getFirebaseAdmin();
  const pendingCommands: Array<{
    id: string;
    action: string;
    volume_ml: number;
    user_id: string;
    expires_at: number;
    bypass_safety?: boolean;
  }> = [];

  const now = Date.now();

  if (isConfigured && db) {
    try {
      const snapshot = await db
        .ref(`devices/${deviceId}/commands`)
        .orderByChild("status")
        .equalTo("PENDING")
        .once("value");

      const data = snapshot.val();
      if (data) {
        for (const [key, val] of Object.entries(data)) {
          const cmd = val as {
            action: string;
            volume_ml: number;
            user_id: string;
            expires_at: number;
            status: string;
            bypass_safety?: boolean;
          };
          // Filter expired commands
          if (cmd.expires_at && cmd.expires_at < now) {
            await db.ref(`devices/${deviceId}/commands/${key}/status`).set("FAILED");
          } else {
            pendingCommands.push({
              id: key,
              action: cmd.action,
              volume_ml: cmd.volume_ml,
              user_id: cmd.user_id,
              expires_at: cmd.expires_at,
              bypass_safety: cmd.bypass_safety ?? false,
            });
            // Tandai langsung sebagai DISPATCHED di Firebase agar tidak terkirim ulang
            await db.ref(`devices/${deviceId}/commands/${key}/status`).set("DISPATCHED");
            // Sinkronkan juga ke memory store
            const simStore = getSimulationStore();
            if (simStore.commands[key]) {
              simStore.commands[key].status = "DISPATCHED" as any;
            }
          }
        }
      }
    } catch (err) {
      console.error("[Commands Query Error]:", err);
    }
  }

  // Also merge in-memory store commands (Guarantees local testing works instantly)
  const simStore = getSimulationStore();
  Object.entries(simStore.commands).forEach(([key, cmd]) => {
    if (cmd.status === "PENDING") {
      if (cmd.expires_at < now) {
        cmd.status = "FAILED";
      } else {
        // Prevent duplicate if already fetched from Firebase
        if (!pendingCommands.some((c) => c.id === key)) {
          pendingCommands.push({
            id: key,
            action: cmd.action,
            volume_ml: cmd.volume_ml,
            bypass_safety: (cmd as any).bypass_safety ?? false,
            user_id: cmd.user_id,
            expires_at: cmd.expires_at,
          });
          // Mark as DISPATCHED so it is never re-sent to ESP32 repeatedly
          cmd.status = "DISPATCHED" as any;
        }
      }
    }
  });

  return NextResponse.json({
    deviceId,
    commands: pendingCommands,
    timestamp: now,
  });
}
