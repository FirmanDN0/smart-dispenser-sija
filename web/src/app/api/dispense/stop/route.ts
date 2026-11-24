import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { getSimulationStore, updateSimulatedTelemetry } from "@/lib/simulation";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("sija_session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Sesi tidak ditemukan. Silakan login." }, { status: 401 });
  }

  const student = verifySessionToken(token);
  if (!student) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    const { deviceId = "dispenser01" } = await request.json().catch(() => ({}));
    const now = Date.now();
    const commandId = `cmd_stop_${now}_${Math.random().toString(36).substring(2, 6)}`;

    const stopCommand = {
      id: commandId,
      action: "STOP_DISPENSE" as const,
      volume_ml: 0,
      user_id: student.id,
      user_name: student.name,
      status: "PENDING" as const,
      created_at: now,
      expires_at: now + 30 * 1000,
    };

    const { db, isConfigured } = getFirebaseAdmin();
    if (isConfigured && db) {
      await db.ref(`devices/${deviceId}/commands/${commandId}`).set(stopCommand);
    } else {
      updateSimulatedTelemetry({ pump_running: false });
    }

    return NextResponse.json({
      success: true,
      message: "Perintah darurat STOP dikirim ke cloud. (ESP32 juga memiliki safety cutoff lokal independen).",
    });
  } catch (error) {
    console.error("[Stop Dispense Error]:", error);
    return NextResponse.json({ error: "Gagal mengirim sinyal STOP." }, { status: 500 });
  }
}
