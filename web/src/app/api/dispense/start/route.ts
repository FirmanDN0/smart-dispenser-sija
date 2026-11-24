import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { getSimulationStore, simulateDispenseProgress } from "@/lib/simulation";
import { z } from "zod";

const startDispenseSchema = z.object({
  volumeMl: z.number().int().min(20).max(500),
  deviceId: z.string().default("dispenser01"),
  simulate: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  // 1. Verify Student Session
  const token = request.cookies.get("sija_session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Sesi tidak ditemukan. Silakan login terlebih dahulu." }, { status: 401 });
  }

  const student = verifySessionToken(token);
  if (!student) {
    return NextResponse.json({ error: "Sesi telah berakhir atau tidak valid." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = startDispenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Parameter tidak valid" },
        { status: 400 }
      );
    }

    const { volumeMl, deviceId, simulate } = parsed.data;
    const now = Date.now();
    const commandId = `cmd_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = now + 45 * 1000; // 45s command expiration

    const commandPayload = {
      id: commandId,
      action: "START_DISPENSE" as const,
      volume_ml: volumeMl,
      user_id: student.id,
      user_name: student.name,
      status: "PENDING" as const,
      created_at: now,
      expires_at: expiresAt,
    };

    // If explicit simulation mode is requested or Firebase Admin is not configured
    const { db, isConfigured } = getFirebaseAdmin();
    if (simulate || !isConfigured || !db) {
      const simStore = getSimulationStore();
      simStore.commands[commandId] = commandPayload;
      // Trigger simulation runner
      simulateDispenseProgress(volumeMl, student.id, student.name);

      return NextResponse.json({
        success: true,
        commandId,
        message: "Perintah dispensing dijadwalkan (Mode Simulasi Aktif).",
        simulation: true,
      });
    }

    // Write real command to Firebase Realtime Database
    await db.ref(`devices/${deviceId}/commands/${commandId}`).set(commandPayload);

    return NextResponse.json({
      success: true,
      commandId,
      message: "Perintah dispensing terkirim ke antrean cloud. Menunggu ESP32...",
      simulation: false,
    });
  } catch (error) {
    console.error("[Start Dispense Error]:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat mengirim perintah." }, { status: 500 });
  }
}
