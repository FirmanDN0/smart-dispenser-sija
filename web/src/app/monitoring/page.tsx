"use client";

import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import TelemetryCard from "@/components/TelemetryCard";
import { Cpu, Activity, Clock, Droplet, Check, AlertTriangle, XOctagon } from "lucide-react";

export default function MonitoringPage() {
  const { telemetry, deviceState, currentTime, secondsAgo } = useDeviceTelemetry();

  return (
    <div className="space-y-6">
      {/* Header Realtime */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Pemantauan Telemetri Sensor Realtime
            </h2>
            <span className="flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-semibold">LIVE LOKAL</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data telemetri langsung dari mikrokontroler ESP32 via Wi-Fi lokal dengan latensi &lt; 50ms.
          </p>
        </div>

        {/* Realtime Time & Status Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Digital Clock */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-cyan-300 font-mono text-xs shadow-sm border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>{currentTime.toLocaleTimeString("id-ID")} WIB</span>
          </div>

          {/* Sync Status Badge */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono border ${
              deviceState.is_online
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                deviceState.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span>
              {deviceState.is_online
                ? `Update: ${secondsAgo === 0 ? "Baru saja" : `${secondsAgo}s lalu`}`
                : "Menunggu ESP32..."}
            </span>
          </div>
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
            <span className="text-3xl font-bold font-mono text-blue-600">
              {telemetry.measured_volume_ml}
            </span>
            <span className="text-xs font-mono text-slate-500">ml terukur</span>
          </div>

          {/* Visual Flow Volume Bar */}
          <div className="my-2.5">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  telemetry.pump_running
                    ? "bg-gradient-to-r from-blue-600 to-cyan-400 animate-pulse"
                    : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, Math.round(((telemetry.measured_volume_ml || 0) / 250) * 100)))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>0 ml</span>
              <span>Ref: 250 ml (Gelas Standar)</span>
            </div>
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
            <span className="text-slate-500">Status Suara:</span>
            <span className="font-mono text-slate-800">
              {telemetry.buzzer_active ? "ALARM AKTIF" : "HENING"}
            </span>
          </div>
        </div>
      </div>

      {/* Status Koneksi Hardware ESP32 */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-sm">Status Sinkronisasi Hardware ESP32 (Lokal)</h3>
          </div>
          <span className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gateway Lokal Aktif</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-md border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Target Gateway ESP32:</span>
            <span className="font-mono font-bold text-blue-300">http://192.168.1.38:3000</span>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-md border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Endpoint Telemetri:</span>
            <span className="font-mono font-bold text-blue-300">/api/device/telemetry</span>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-md border border-slate-700/60">
            <span className="text-slate-400 block mb-1">Status Relay Pompa:</span>
            <span className={`font-mono font-bold ${telemetry.pump_running ? "text-amber-400" : "text-emerald-400"}`}>
              {telemetry.pump_running ? "PUMP ACTIVE (ON)" : "STANDBY (OFF)"}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          💡 <strong>Tips:</strong> Data sensor di atas diperbarui secara otomatis secara realtime langsung dari mikrokontroler ESP32 fisik via Wi-Fi lokal. Letakkan tangan atau cangkir di depan sensor ultrasonik HC-SR04 (&lt; 10 cm) untuk menguji deteksi cangkir.
        </p>
      </div>
    </div>
  );
}
2