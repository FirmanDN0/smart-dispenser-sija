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
        Object.entries(data).forEach(([key, val]) => {
          const cmd = val as {
            action: string;
            volume_ml: number;
            user_id: string;
            expires_at: number;
            status: string;
          };
          // Filter expired commands
          if (cmd.expires_at && cmd.expires_at < now) {
            db.ref(`devices/${deviceId}/commands/${key}/status`).set("FAILED");
          } else {
            pendingCommands.push({
              id: key,
              action: cmd.action,
              volume_ml: cmd.volume_ml,
              user_id: cmd.user_id,
              expires_at: cmd.expires_at,
            });
          }
        });
      }
    } catch (err) {
      console.error("[Commands Query Error]:", err);
    }
  } else {
    // In-memory simulation fallback
    const simStore = getSimulationStore();
    Object.entries(simStore.commands).forEach(([key, cmd]) => {
      if (cmd.status === "PENDING") {
        if (cmd.expires_at < now) {
          cmd.status = "FAILED";
        } else {
          pendingCommands.push({
            id: key,
            action: cmd.action,
            volume_ml: cmd.volume_ml,
            user_id: cmd.user_id,
            expires_at: cmd.expires_at,
          });
        }
      }
    });
  }

  return NextResponse.json({
    deviceId,
    commands: pendingCommands,
    timestamp: now,
  });
}
