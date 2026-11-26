import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { getSimulationStore, simulateDispenseProgress, updateSimulatedTelemetry } from "@/lib/simulation";
import { z } from "zod";

const startDispenseSchema = z.object({
  volumeMl: z.number().int().min(20).max(500),
  deviceId: z.string().default("dispenser01"),
  simulate: z.boolean().optional(),
  bypassSafety: z.boolean().optional(),
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

    const { volumeMl, deviceId, simulate, bypassSafety } = parsed.data;
    const now = Date.now();
    const commandId = `cmd_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = now + 45 * 1000; // 45s command expiration

    const commandPayload = {
      id: commandId,
      action: "START_DISPENSE" as const,
      volume_ml: volumeMl,
      bypass_safety: bypassSafety ?? false,
      user_id: student.id,
      user_name: student.name,
      status: "PENDING" as const,
      created_at: now,
      expires_at: expiresAt,
    };

    // Reset volume air & pulsa ke 0 setiap kali pengisian baru dimulai
    updateSimulatedTelemetry({
      measured_volume_ml: 0,
      flow_pulses: 0,
    });

    // Always register in local memory store so local ESP32 polling /api/device/commands immediately gets it
    const simStore = getSimulationStore();
    simStore.commands[commandId] = commandPayload;

    // Also persist to Firebase Realtime Database if configured
    const { db, isConfigured } = getFirebaseAdmin();
    if (isConfigured && db) {
      try {
        await db.ref(`devices/${deviceId}/commands/${commandId}`).set(commandPayload);
      } catch (e) {
        console.warn("[Firebase Command Write Warning]:", e);
      }
    }

    return NextResponse.json({
      success: true,
      commandId,
      message: "Perintah dispensing berhasil dikirim ke antrean ESP32 lokal.",
      simulation: false,
    });
  } catch (error) {
    console.error("[Start Dispense Error]:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat mengirim perintah." }, { status: 500 });
  }
}
