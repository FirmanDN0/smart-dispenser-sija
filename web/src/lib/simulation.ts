// In-Memory Simulation State Provider
// Fulfills Requirement 12: Distinct Simulation Mode and Real Hardware Mode.
// Clearly separates simulated test execution from physical telemetry.

import { TelemetryData, DeviceState, DispenseCommand, DispenseLog, ViolationEvent, AIResultLog } from "@/types";

export interface SimulationStore {
  telemetry: TelemetryData;
  state: DeviceState;
  commands: Record<string, DispenseCommand>;
  dispenseLogs: DispenseLog[];
  violations: ViolationEvent[];
  aiLogs: AIResultLog[];
}

// Global singleton in memory for local testing / simulation mode
const globalSimStore: SimulationStore = {
  telemetry: {
    cup_distance_cm: 6.8,
    cup_detected: true,
    reservoir_distance_cm: 5.2,
    reservoir_percentage: 78.0,
    tray_adc: 310,
    spill_detected: false,
    flow_pulses: 0,
    measured_volume_ml: 0,
    flow_rate_lpm: 0,
    pump_running: false,
    buzzer_active: false,
    ai_classification: "AMAN",
    ai_risk_level: "LOW",
    ai_explanation: "Semua sensor normal (Mode Simulasi Aktif).",
    wifi_rssi: -55,
    ip_address: "192.168.1.100 (Simulasi)",
    timestamp: Date.now(),
  },
  state: {
    status: "IDLE",
    active_command_id: null,
    current_user_id: null,
    is_online: true,
    wifi_rssi: -55,
    ip_address: "192.168.1.100 (Simulasi)",
    firmware_version: "1.0.0-sim",
    last_seen: Date.now(),
  },
  commands: {},
  dispenseLogs: [
    {
      id: "sim_log_1",
      device_id: "dispenser01",
      user_id: "student_01",
      student_name: "Ahmad Fauzi",
      requested_volume_ml: 200,
      measured_volume_ml: 200,
      flow_pulses: 240,
      duration_ms: 8100,
      status: "COMPLETED",
      timestamp: Date.now() - 3600000,
    },
    {
      id: "sim_log_2",
      device_id: "dispenser01",
      user_id: "student_02",
      student_name: "Bunga Citra",
      requested_volume_ml: 100,
      measured_volume_ml: 100,
      flow_pulses: 120,
      duration_ms: 4200,
      status: "COMPLETED",
      timestamp: Date.now() - 7200000,
    },
  ],
  violations: [],
  aiLogs: [],
};

export function getSimulationStore(): SimulationStore {
  return globalSimStore;
}

export function updateSimulatedTelemetry(patch: Partial<TelemetryData>) {
  globalSimStore.telemetry = {
    ...globalSimStore.telemetry,
    ...patch,
    timestamp: Date.now(),
  };
  globalSimStore.state.last_seen = Date.now();
  globalSimStore.state.is_online = true;
}

export function simulateDispenseProgress(volumeMl: number, studentId: string, studentName: string) {
  // Start simulation of water pump
  updateSimulatedTelemetry({
    pump_running: true,
    measured_volume_ml: 0,
    flow_pulses: 0,
  });

  let currentVolume = 0;
  const interval = setInterval(() => {
    currentVolume += 25;
    const pulses = Math.round(currentVolume * 1.2);
    if (currentVolume >= volumeMl) {
      clearInterval(interval);
      updateSimulatedTelemetry({
        pump_running: false,
        measured_volume_ml: volumeMl,
        flow_pulses: pulses,
      });
      // Append dispense log
      globalSimStore.dispenseLogs.unshift({
        id: `sim_log_${Date.now()}`,
        device_id: "dispenser01",
        user_id: studentId,
        student_name: studentName,
        requested_volume_ml: volumeMl,
        measured_volume_ml: volumeMl,
        flow_pulses: pulses,
        duration_ms: 6000,
        status: "COMPLETED",
        timestamp: Date.now(),
      });
    } else {
      updateSimulatedTelemetry({
        pump_running: true,
        measured_volume_ml: currentVolume,
        flow_pulses: pulses,
      });
    }
  }, 400);
}
