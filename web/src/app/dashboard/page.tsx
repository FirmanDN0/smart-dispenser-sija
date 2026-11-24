"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import TelemetryCard from "@/components/TelemetryCard";
import StatusBanner from "@/components/StatusBanner";
import { 
  Droplet, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Cpu
} from "lucide-react";
import { StudentProfile } from "@/types";

export default function DashboardPage() {
  const { telemetry, deviceState } = useDeviceTelemetry();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [todayDispensedMl, setTodayDispensedMl] = useState(400);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setStudent(data.student);
        }
      })
      .catch(() => {});
  }, []);

  const dailyGoal = student?.daily_goal_ml || 1500;
  const progressPercent = Math.min(100, Math.round((todayDispensedMl / dailyGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Realtime Safety Status Banner */}
      <StatusBanner
        classification={telemetry.ai_classification}
        riskLevel={telemetry.ai_risk_level}
        explanation={telemetry.ai_explanation}
        isOnline={deviceState.is_online}
        pumpRunning={telemetry.pump_running}
        spillDetected={telemetry.spill_detected}
      />

      {/* Top Profile & Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student Session & Hydration Progress */}
        <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Profil Siswa Aktif
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                SIJA UKL 3
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              {student ? student.name : "Siswa Belum Login"}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {student ? `${student.nis} • ${student.class}` : "Silakan masuk untuk mencatat hidrasi"}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-600">Target Hidrasi Harian:</span>
              <span className="font-mono font-semibold text-slate-800">
                {todayDispensedMl} / {dailyGoal} ml ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#2563EB] h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Primary Reservoir Level */}
        <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Level Tandon Air
            </span>
            <Droplet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                {telemetry.reservoir_percentage}
              </span>
              <span className="text-sm font-mono text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Jarak sensor ultrasonik: {telemetry.reservoir_distance_cm} cm
            </p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                telemetry.reservoir_percentage <= 20
                  ? "bg-amber-500"
                  : telemetry.reservoir_percentage <= 10
                  ? "bg-red-600"
                  : "bg-emerald-600"
              }`}
              style={{ width: `${Math.min(100, telemetry.reservoir_percentage)}%` }}
            />
          </div>
        </div>

        {/* Quick Dispense Action Card */}
        <div className="bg-[#112D4E] text-white rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-300 text-xs">
              <span className="uppercase font-semibold tracking-wider">Aksi Cepat</span>
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="text-lg font-bold mt-2">Ambil Air Minum</h4>
            <p className="text-xs text-slate-300 mt-1">
              Pilih takaran dispenser otomatis terukur dengan sensor aliran YF-S201.
            </p>
          </div>

          <Link
            href="/dispense"
            className="mt-4 flex items-center justify-center space-x-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded transition"
          >
            <span>Buka Panel Dispensing</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Ringkasan Telemetri Sensor Fisik (ESP32)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TelemetryCard
            label="Deteksi Cangkir"
            value={telemetry.cup_detected ? "TERPASANG" : "KOSONG"}
            subtext={`Jarak: ${telemetry.cup_distance_cm} cm`}
            badge={{
              text: telemetry.cup_detected ? "Valid" : "Tidak Ada",
              type: telemetry.cup_detected ? "safe" : "danger",
            }}
          />

          <TelemetryCard
            label="Baki Tetesan (Spill)"
            value={telemetry.spill_detected ? "TERGENANG" : "KERING"}
            subtext={`ADC: ${telemetry.tray_adc} / 4095`}
            badge={{
              text: telemetry.spill_detected ? "Tumpahan" : "Normal",
              type: telemetry.spill_detected ? "danger" : "safe",
            }}
          />

          <TelemetryCard
            label="Status Pompa (Relay)"
            value={telemetry.pump_running ? "MENYALA" : "MATI"}
            subtext={`Pulsa: ${telemetry.flow_pulses}`}
            badge={{
              text: telemetry.pump_running ? "Flowing" : "Standby",
              type: telemetry.pump_running ? "warning" : "neutral",
            }}
          />

          <TelemetryCard
            label="Klasifikasi AI"
            value={telemetry.ai_classification}
            subtext={`Tingkat Risiko: ${telemetry.ai_risk_level}`}
            badge={{
              text: telemetry.ai_classification,
              type:
                telemetry.ai_classification === "AMAN"
                  ? "safe"
                  : telemetry.ai_classification === "AIR_RENDAH"
                  ? "warning"
                  : "danger",
            }}
          />
        </div>
      </div>

      {/* AI Explanation & Hardware Telemetry Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Insight Box */}
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center space-x-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Hasil Evaluasi Kecerdasan Artifisial (ESP32 Local AI)
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded font-mono">
            {telemetry.ai_explanation}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Model: Rule-Based Classifier v1.0</span>
            <Link href="/ai-insights" className="text-blue-600 hover:underline">
              Lihat Analisis Aturan &rarr;
            </Link>
          </div>
        </div>

        {/* Device Health / Network Status */}
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Cpu className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Status Perangkat IoT (dispenser01)
            </h4>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Status Jaringan:</span>
              <span className={deviceState.is_online ? "text-emerald-700 font-semibold" : "text-red-600"}>
                {deviceState.is_online ? "ONLINE (Tersambung)" : "OFFLINE"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Alamat IP:</span>
              <span className="text-slate-800">{telemetry.ip_address || "192.168.1.105"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Kekuatan Sinyal (RSSI):</span>
              <span className="text-slate-800">{telemetry.wifi_rssi || -58} dBm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
