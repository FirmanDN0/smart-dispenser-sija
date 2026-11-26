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
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  // Live ticking local clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (deviceState.last_seen) {
        const diffSec = Math.max(0, Math.floor((now.getTime() - deviceState.last_seen) / 1000));
        setSecondsAgo(diffSec);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deviceState.last_seen]);

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
          const isOnline = Date.now() - val < 6000;
          setDeviceState((prev) => ({ ...prev, last_seen: val, is_online: isOnline }));
        }
      });
    }

    // 2. Continuous Fast Local Gateway Polling (400ms for instantaneous local sync)
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

    // Initial fetch and 400ms interval for super fast local responsiveness
    pollServer();
    const interval = setInterval(pollServer, 400);

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

  return { telemetry, deviceState, isLiveConnected, currentTime, secondsAgo };
}
