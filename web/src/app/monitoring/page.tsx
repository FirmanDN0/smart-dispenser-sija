"use client";

import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import TelemetryCard from "@/components/TelemetryCard";
import { Cpu, Activity, Clock, ShieldAlert, Waves } from "lucide-react";

export default function MonitoringPage() {
  const { telemetry, deviceState } = useDeviceTelemetry();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Pemantauan Telemetri Sensor Realtime
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data aktual dari microchip ESP32 yang disinkronisasi melalui Firebase Realtime Database.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Waktu Telemetri: {new Date(telemetry.timestamp).toLocaleTimeString("id-ID")}</span>
        </div>
      </div>

      {/* Grid of All Raw Sensors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sensor 1: Ultrasonic Cup */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 uppercase">HC-SR04 Deteksi Cangkir</span>
            <span className="font-mono text-[10px] text-slate-400">TRIG: 13 | ECHO: 14</span>
          </div>
          <div className="flex items-baseline space-x-1.5 my-2">
            <span className="text-3xl font-bold font-mono text-slate-900">
              {telemetry.cup_distance_cm}
            </span>
            <span className="text-xs font-mono text-slate-500">cm</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Kondisi Cangkir:</span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                telemetry.cup_detected
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {telemetry.cup_detected ? "CANGKIR SIAP" : "CANGKIR TIDAK ADA"}
            </span>
          </div>
        </div>

        {/* Sensor 2: Ultrasonic Reservoir */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 uppercase">HC-SR04 Level Tandon Air</span>
            <span className="font-mono text-[10px] text-slate-400">TRIG: 16 | ECHO: 17</span>
          </div>
          <div className="flex items-baseline space-x-1.5 my-2">
            <span className="text-3xl font-bold font-mono text-slate-900">
              {telemetry.reservoir_percentage}
            </span>
            <span className="text-xs font-mono text-slate-500">%</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Jarak Fisik Permukaan:</span>
            <span className="font-mono text-slate-800 font-semibold">
              {telemetry.reservoir_distance_cm} cm
            </span>
          </div>
        </div>

        {/* Sensor 3: Water Flow Sensor YF-S201 */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 uppercase">YF-S201 Flow Sensor</span>
            <span className="font-mono text-[10px] text-slate-400">SIGNAL: GPIO 27</span>
          </div>
          <div className="flex items-baseline space-x-1.5 my-2">
            <span className="text-3xl font-bold font-mono text-slate-900">
              {telemetry.measured_volume_ml}
            </span>
            <span className="text-xs font-mono text-slate-500">ml terukur</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Akumulasi Pulsa:</span>
            <span className="font-mono text-slate-800 font-semibold">
              {telemetry.flow_pulses} pulses
            </span>
          </div>
        </div>

        {/* Sensor 4: Analog Spill Sensor */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 uppercase">Analog Spill / Tray Sensor</span>
            <span className="font-mono text-[10px] text-slate-400">ADC: GPIO 34</span>
          </div>
          <div className="flex items-baseline space-x-1.5 my-2">
            <span className="text-3xl font-bold font-mono text-slate-900">
              {telemetry.tray_adc}
            </span>
            <span className="text-xs font-mono text-slate-500">/ 4095 ADC</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Deteksi Tumpahan:</span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                telemetry.spill_detected
                  ? "bg-red-50 text-red-800 border-red-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {telemetry.spill_detected ? "BASAH (TUMPAH)" : "KERING (AMAN)"}
            </span>
          </div>
        </div>

        {/* Actuator 1: Relay & Pump */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 uppercase">Relay Pompa 5V</span>
            <span className="font-mono text-[10px] text-slate-400">IN: GPIO 26</span>
          </div>
          <div className="flex items-baseline space-x-1.5 my-2">
            <span
              className={`text-2xl font-bold font-mono ${
                telemetry.pump_running ? "text-blue-600" : "text-slate-700"
              }`}
            >
              {telemetry.pump_running ? "ENERGIZED (ON)" : "DE-ENERGIZED (OFF)"}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Polaritas Kontrol:</span>
            <span className="font-mono text-slate-800">ACTIVE-LOW</span>
          </div>
        </div>

        {/* Actuator 2: Passive Buzzer */}
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-slate-700 uppercase">Passive Buzzer PWM</span>
            <span className="font-mono text-[10px] text-slate-400">PWM: GPIO 25</span>
          </div>
          <div className="flex items-baseline space-x-1.5 my-2">
            <span className="text-2xl font-bold font-mono text-slate-700">
              {telemetry.buzzer_active ? "ALARM AKTIF" : "STANDBY (SILENT)"}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Duty Cycle:</span>
            <span className="font-mono text-slate-800">
              {telemetry.buzzer_active ? "50% (512/1024)" : "0%"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
