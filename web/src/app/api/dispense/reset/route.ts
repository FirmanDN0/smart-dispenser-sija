import { NextResponse } from "next/server";
import { updateSimulatedTelemetry, getSimulationStore } from "@/lib/simulation";

export async function POST() {
  updateSimulatedTelemetry({
    measured_volume_ml: 0,
    flow_pulses: 0,
  });

  return NextResponse.json({
    success: true,
    message: "Volume aliran air dan pulsa berhasil direset ke 0 ml.",
    timestamp: Date.now(),
  });
}
