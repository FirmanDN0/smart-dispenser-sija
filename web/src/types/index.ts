// TypeScript Interfaces for Smart Dispenser IoT

export type AIClassification =
  | "AMAN"
  | "GELAS_TIDAK_ADA"
  | "AIR_RENDAH"
  | "TUMPAHAN"
  | "ALIRAN_BERMASALAH"
  | "SENSOR_ERROR";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CommandStatus =
  | "PENDING"
  | "ACKNOWLEDGED"
  | "RUNNING"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED";

export type DeviceOperationalStatus = "IDLE" | "DISPENSING" | "WARNING" | "EMERGENCY_STOP" | "OFFLINE";

export interface TelemetryData {
  cup_distance_cm: number;
  cup_detected: boolean;
  reservoir_distance_cm: number;
  reservoir_percentage: number;
  tray_adc: number;
  spill_detected: boolean;
  flow_pulses: number;
  measured_volume_ml: number;
  flow_rate_lpm?: number;
  pump_running: boolean;
  buzzer_active: boolean;
  ai_classification: AIClassification;
  ai_risk_level: RiskLevel;
  ai_explanation: string;
  wifi_rssi?: number;
  ip_address?: string;
  timestamp: number;
}

export interface DeviceState {
  status: DeviceOperationalStatus;
  active_command_id: string | null;
  current_user_id: string | null;
  is_online: boolean;
  wifi_rssi: number;
  ip_address: string;
  firmware_version: string;
  last_seen: number;
}

export interface DispenseCommand {
  id: string;
  action: "START_DISPENSE" | "STOP_DISPENSE";
  volume_ml: number;
  user_id: string;
  user_name?: string;
  status: CommandStatus;
  created_at: number;
  expires_at: number;
}

export interface CommandAcknowledgment {
  command_id: string;
  device_id: string;
  status: CommandStatus;
  actual_volume_ml: number;
  duration_ms: number;
  message: string;
  timestamp: number;
}

export interface StudentProfile {
  id: string;
  nis: string;
  name: string;
  class: string;
  daily_goal_ml: number;
  pin_hash: string; // SHA-256 hash of 4-digit PIN
  created_at: number;
}

export interface UserSettings {
  default_volume_ml: number;
  reminder_interval_min: number;
  sound_enabled: boolean;
  simulation_mode?: boolean;
}

export interface DispenseLog {
  id: string;
  device_id: string;
  user_id: string;
  student_name: string;
  requested_volume_ml: number;
  measured_volume_ml: number;
  flow_pulses: number;
  duration_ms: number;
  status: "COMPLETED" | "INTERRUPTED" | "FAILED";
  timestamp: number;
}

export interface ViolationEvent {
  id: string;
  device_id: string;
  user_id: string | null;
  student_name?: string;
  type: "CUP_REMOVED_DURING_FILL" | "TRAY_SPILL_DETECTED" | "NO_FLOW_BLOCKAGE";
  severity: "HIGH" | "CRITICAL";
  description: string;
  sensor_snapshot: {
    cup_distance_cm?: number;
    tray_adc?: number;
    flow_pulses?: number;
    measured_volume_ml?: number;
  };
  timestamp: number;
}

export interface AIResultLog {
  id: string;
  device_id: string;
  classification: AIClassification;
  risk_level: RiskLevel;
  explanation: string;
  evidence: Record<string, unknown>;
  recommended_action: string;
  timestamp: number;
}
