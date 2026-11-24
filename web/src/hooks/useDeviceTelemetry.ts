"use client";

import { useState, useEffect } from "react";
import { getFirebaseClient } from "@/lib/firebase-client";
import { ref, onValue, off } from "firebase/database";
import { TelemetryData, DeviceState } from "@/types";

const DEFAULT_TELEMETRY: TelemetryData = {
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
  ai_explanation: "Menghubungkan ke data telemetri...",
  wifi_rssi: -58,
  ip_address: "192.168.1.105",
  timestamp: Date.now(),
};

export function useDeviceTelemetry(deviceId = "dispenser01") {
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const [deviceState, setDeviceState] = useState<DeviceState>({
    status: "IDLE",
    active_command_id: null,
    current_user_id: null,
    is_online: true,
    wifi_rssi: -58,
    ip_address: "192.168.1.105",
    firmware_version: "1.0.0",
    last_seen: Date.now(),
  });
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    const { db } = getFirebaseClient();

    // 1. If Firebase Web SDK is available and configured
    if (db) {
      const telemRef = ref(db, `devices/${deviceId}/telemetry/latest`);
      const stateRef = ref(db, `devices/${deviceId}/state`);
      const lastSeenRef = ref(db, `devices/${deviceId}/lastSeen`);

      onValue(
        telemRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val && isSubscribed) {
            setTelemetry(val);
            setIsLiveConnected(true);
          }
        },
        () => {
          setIsLiveConnected(false);
        }
      );

      onValue(stateRef, (snapshot) => {
        const val = snapshot.val();
        if (val && isSubscribed) {
          setDeviceState((prev) => ({ ...prev, ...val }));
        }
      });

      onValue(lastSeenRef, (snapshot) => {
        const val = snapshot.val();
        if (val && isSubscribed) {
          const isOnline = Date.now() - val < 12000;
          setDeviceState((prev) => ({ ...prev, last_seen: val, is_online: isOnline }));
        }
      });
    }

    // 2. Continuous Gateway Polling fallback (Ensures real ESP32 data is ALWAYS mirrored in web)
    const pollServer = async () => {
      try {
        const res = await fetch("/api/device/telemetry");
        if (res.ok) {
          const data = await res.json();
          if (data && data.telemetry && isSubscribed) {
            setTelemetry(data.telemetry);
            if (data.state) {
              setDeviceState((prev) => ({ ...prev, ...data.state }));
            }
            setIsLiveConnected(true);
          }
        }
      } catch (e) {
        console.warn("[Polling Error]:", e);
      }
    };

    // Initial fetch and 1.5s interval
    pollServer();
    const interval = setInterval(pollServer, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (db) {
        off(ref(db, `devices/${deviceId}/telemetry/latest`));
        off(ref(db, `devices/${deviceId}/state`));
        off(ref(db, `devices/${deviceId}/lastSeen`));
      }
    };
  }, [deviceId]);

  return { telemetry, deviceState, isLiveConnected };
}
