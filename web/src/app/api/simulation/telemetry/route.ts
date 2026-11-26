import { NextRequest, NextResponse } from "next/server";
import { updateSimulatedTelemetry, getSimulationStore } from "@/lib/simulation";
import { AIClassification, RiskLevel } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cup_cm = typeof body.cup_distance_cm === "number" ? body.cup_distance_cm : 6.8;
    const res_pct = typeof body.reservoir_percentage === "number" ? body.reservoir_percentage : 78;
    const tray_adc = typeof body.tray_adc === "number" ? body.tray_adc : 310;
    const pump_running = Boolean(body.pump_running);

    const cup_detected = cup_cm > 0 && cup_cm <= 10.0;
    const spill_detected = tray_adc >= 1200;
    const res_dist_cm = Number((18.0 - (res_pct / 100.0) * (18.0 - 4.0)).toFixed(1));

    // Rule-Based AI Engine Logic
    let ai_class: AIClassification = "AMAN";
    let ai_risk: RiskLevel = "LOW";
    let ai_exp = "Kondisi dispenser normal. Cangkir terpasang, level air mencukupi, baki kering.";

    if (cup_cm < 0 || cup_cm > 200 || res_dist_cm < 0 || res_dist_cm > 200) {
      ai_class = "SENSOR_ERROR";
      ai_risk = "HIGH";
      ai_exp = "Sensor ultrasonik membaca jarak di luar batas fisik valid.";
    } else if (spill_detected) {
      ai_class = "TUMPAHAN";
      ai_risk = "CRITICAL";
      ai_exp = `Baki tetesan mendeteksi genangan air (ADC ${tray_adc} >= 1200).`;
    } else if (pump_running && !cup_detected) {
      ai_class = "GELAS_TIDAK_ADA";
      ai_risk = "CRITICAL";
      ai_exp = `Cangkir terlepas saat pompa menyala (jarak ${cup_cm} cm > 10.0 cm).`;
    } else if (res_pct <= 20) {
      ai_class = "AIR_RENDAH";
      ai_risk = "MEDIUM";
      ai_exp = `Level tandon air rendah (${res_pct}% <= 20%).`;
    } else if (!cup_detected && !pump_running) {
      ai_class = "GELAS_TIDAK_ADA";
      ai_risk = "LOW";
      ai_exp = `Dispenser siaga menunggu cangkir diletakkan (jarak ${cup_cm} cm).`;
    }

    const updated = {
      cup_distance_cm: cup_cm,
      cup_detected,
      reservoir_distance_cm: res_dist_cm,
      reservoir_percentage: res_pct,
      tray_adc,
      spill_detected,
      flow_pulses: body.flow_pulses ?? 0,
      measured_volume_ml: body.measured_volume_ml ?? 0,
      pump_running,
      buzzer_active: ai_risk === "CRITICAL",
      ai_classification: ai_class,
      ai_risk_level: ai_risk,
      ai_explanation: ai_exp,
      timestamp: Date.now(),
    };

    updateSimulatedTelemetry(updated);

    return NextResponse.json({ success: true, telemetry: updated });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
