"use client";

import { useState, useEffect } from "react";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { DISPENSE_PRESETS } from "@/lib/constants";
import { Droplet, AlertOctagon, CheckCircle2, Clock, AlertTriangle, Play } from "lucide-react";

export default function DispensePage() {
  const { telemetry, deviceState } = useDeviceTelemetry();
  const [selectedVolume, setSelectedVolume] = useState<number>(200);
  const [sessionVolume, setSessionVolume] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bypassSafety, setBypassSafety] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [wasPumpRunning, setWasPumpRunning] = useState(false);

  // Track live volume saat pompa berjalan
  useEffect(() => {
    if (telemetry.pump_running) {
      setSessionVolume(telemetry.measured_volume_ml);
      setWasPumpRunning(true);
    } else if (wasPumpRunning) {
      // Saat pompa selesai: jika sudah mencapai >= 75% target, genapkan ke target (100% penuh)
      setSessionVolume((prev) => (prev >= selectedVolume * 0.75 ? selectedVolume : prev));
      setWasPumpRunning(false);
    }
  }, [telemetry.pump_running, telemetry.measured_volume_ml, wasPumpRunning, selectedVolume]);

  // Memilih takaran baru otomatis mereset hitungan pengisian ke 0 ml
  const handleSelectVolume = async (vol: number) => {
    setSelectedVolume(vol);
    if (!telemetry.pump_running) {
      setSessionVolume(0);
      try {
        await fetch("/api/dispense/reset", { method: "POST" });
      } catch {}
    }
  };

  const handleManualReset = async () => {
    setSessionVolume(0);
    try {
      await fetch("/api/dispense/reset", { method: "POST" });
      setCommandFeedback({ type: "info", message: "Penghitung volume berhasil direset ke 0 ml." });
    } catch {}
  };

  // Check hardware pre-conditions (Fitur Smart Touchless: Siswa bisa pilih takaran dulu sebelum taruh cangkir!)
  const isCupReady = telemetry.cup_detected;
  const isTankSufficient = telemetry.reservoir_percentage > 10;
  const isTrayDry = !telemetry.spill_detected;
  const canStart = (bypassSafety || (isTankSufficient && isTrayDry)) && !telemetry.pump_running;

  const handleStartDispense = async () => {
    setIsSubmitting(true);
    setSessionVolume(0);
    setCommandFeedback({ type: "info", message: "Menyiapkan takaran ke dispenser..." });

    try {
      // Pastikan server di-reset ke 0 ml saat pengisian baru dimulai
      await fetch("/api/dispense/reset", { method: "POST" });

      const res = await fetch("/api/dispense/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeMl: selectedVolume, bypassSafety }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCommandFeedback({ type: "error", message: data.error || "Gagal memulai pengisian air." });
      } else {
        setCommandFeedback({
          type: "success",
          message: isCupReady
            ? `Perintah aktif. Menuang ${selectedVolume} ml air ke cangkir...`
            : `Takaran ${selectedVolume} ml SIAGA! Silakan letakkan cangkir di bawah corong, pompa akan menyala otomatis.`,
        });
      }
    } catch {
      setCommandFeedback({ type: "error", message: "Gagal terhubung ke gateway API." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await fetch("/api/dispense/stop", { method: "POST" });
      setCommandFeedback({
        type: "error",
        message: "Perintah STOP darurat telah dikirimkan ke ESP32.",
      });
    } catch {
      setCommandFeedback({ type: "error", message: "Gagal mengirim sinyal STOP." });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Panel Pengambilan Air Minum</h2>
        <p className="text-xs text-slate-500 mt-1">
          Kontrol pengisian air presisi menggunakan flow meter YF-S201 dan interlock keselamatan ESP32.
        </p>
      </div>

      {/* Safety Pre-flight Checklist */}
      <div className="bg-white border border-slate-200 rounded-md p-4">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
          Status Kesiapan Fisik (Safety Pre-Flight)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            className={`p-3 rounded border text-xs flex items-center space-x-2.5 ${
              isCupReady
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {isCupReady ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-blue-600 animate-pulse" />}
            <div>
              <p className="font-semibold">{isCupReady ? "Cangkir Terpasang" : "Siaga: Taruh Cangkir"}</p>
              <p className="text-[10px] font-mono">{isCupReady ? `${telemetry.cup_distance_cm} cm` : "Otomatis jalan saat ditaruh"}</p>
            </div>
          </div>

          <div
            className={`p-3 rounded border text-xs flex items-center space-x-2.5 ${
              isTankSufficient
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            {isTankSufficient ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <div>
              <p className="font-semibold">{isTankSufficient ? "Air Tandon Cukup" : "Air Tandon Kritis"}</p>
              <p className="text-[10px] font-mono">{telemetry.reservoir_percentage}%</p>
            </div>
          </div>

          <div
            className={`p-3 rounded border text-xs flex items-center space-x-2.5 ${
              isTrayDry
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {isTrayDry ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
            <div>
              <p className="font-semibold">{isTrayDry ? "Baki Kering" : "Tumpahan Terdeteksi"}</p>
              <p className="text-[10px] font-mono">ADC: {telemetry.tray_adc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Volume Selector */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Pilih Takaran Volume Air
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DISPENSE_PRESETS.map((vol) => (
            <button
              key={vol}
              type="button"
              disabled={telemetry.pump_running}
              onClick={() => handleSelectVolume(vol)}
              className={`p-4 rounded border text-center transition-all ${
                selectedVolume === vol
                  ? "border-[#112D4E] bg-slate-100 text-[#112D4E] font-bold ring-1 ring-[#112D4E]"
                  : "border-slate-200 hover:border-slate-300 text-slate-800"
              }`}
            >
              <span className="text-2xl font-mono block">{vol}</span>
              <span className="text-xs text-slate-500 uppercase">Mililiter (ml)</span>
            </button>
          ))}
        </div>

        {/* Realtime Dispensing Volume & Flow Progress Bar (Selalu Muncul & Update Realtime) */}
        {(() => {
          const liveVolume = telemetry.pump_running ? telemetry.measured_volume_ml : sessionVolume;
          const fillPercentage = Math.min(
            100,
            Math.max(0, Math.round(((liveVolume || 0) / (selectedVolume || 200)) * 100))
          );
          return (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Droplet className={`w-5 h-5 ${telemetry.pump_running ? "text-cyan-400 animate-bounce" : "text-blue-400"}`} />
                    <h3 className="font-semibold text-sm">Indikator Volume Air (Sensor Flow YF-S201)</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={telemetry.pump_running}
                      onClick={handleManualReset}
                      className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 transition font-mono flex items-center space-x-1"
                      title="Reset penghitung volume air ke 0 ml"
                    >
                      <span>🔄 Reset 0 ml</span>
                    </button>
                    <span
                      className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
                        telemetry.pump_running
                          ? "bg-blue-950 text-cyan-300 border-cyan-800"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          telemetry.pump_running ? "bg-cyan-400 animate-ping" : "bg-slate-500"
                        }`}
                      />
                      <span>{telemetry.pump_running ? "Sedang Mengisi Air..." : "Standby / Siap"}</span>
                    </span>
                  </div>
                </div>

                {/* Big Metric Display */}
                <div className="grid grid-cols-3 gap-3 my-4 text-center">
                  <div className="bg-slate-800/80 p-3 rounded-md border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Air Terisi:</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400">
                      {liveVolume}
                      <span className="text-xs text-slate-400 ml-1 font-normal">ml</span>
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-md border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Target Takaran:</span>
                    <span className="text-2xl font-bold font-mono text-slate-200">
                      {selectedVolume}
                      <span className="text-xs text-slate-400 ml-1 font-normal">ml</span>
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-md border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Kemajuan:</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {fillPercentage}
                      <span className="text-xs text-slate-400 ml-1 font-normal">%</span>
                    </span>
                  </div>
                </div>

                {/* Animated Liquid Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>0 ml</span>
                    <span className="font-semibold text-cyan-300">
                      {liveVolume} ml dari {selectedVolume} ml ({fillPercentage}%)
                    </span>
                    <span>{selectedVolume} ml</span>
                  </div>
                  <div className="w-full bg-slate-800 h-5 rounded-full overflow-hidden p-0.5 border border-slate-700 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 relative flex items-center justify-end pr-2 text-[10px] font-bold text-white ${
                        telemetry.pump_running
                          ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 animate-pulse shadow-lg shadow-cyan-500/50"
                          : fillPercentage >= 100
                          ? "bg-emerald-500"
                          : fillPercentage > 0
                          ? "bg-blue-600"
                          : "bg-transparent"
                      }`}
                      style={{ width: `${Math.max(fillPercentage > 0 ? 5 : 0, fillPercentage)}%` }}
                    >
                      {fillPercentage >= 15 && <span>{fillPercentage}%</span>}
                    </div>
                  </div>
                </div>

                {/* Flow Meter Diagnostic Info */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono mt-3 pt-3 border-t border-slate-800/80">
                  <span>Sensor Pulsa: <strong className="text-slate-200">{telemetry.flow_pulses} pulses</strong></span>
                  <span>Pin: <strong className="text-slate-200">GPIO 27</strong></span>
                  <span>Relay: <strong className={telemetry.pump_running ? "text-amber-400" : "text-slate-400"}>
                    {telemetry.pump_running ? "ACTIVE (ON)" : "OFF"}
                  </strong></span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Feedback Alert */}
        {commandFeedback && (
          <div
            className={`mt-4 p-3 rounded text-xs border ${
              commandFeedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : commandFeedback.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {commandFeedback.message}
          </div>
        )}

        {/* Mode Bypass Keselamatan untuk Pengujian Meja / Tanpa Cangkir */}
        <div className="mt-4 flex items-center space-x-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700">
          <input
            id="bypass-checkbox"
            type="checkbox"
            checked={bypassSafety}
            onChange={(e) => setBypassSafety(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="bypass-checkbox" className="cursor-pointer font-medium">
            Mode Uji Coba Cepat (Abaikan deteksi cangkir & tandon agar pompa langsung jalan)
          </label>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={!canStart || isSubmitting}
            onClick={handleStartDispense}
            className="flex-1 flex items-center justify-center space-x-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 px-6 rounded text-sm transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {telemetry.pump_running
                ? "Sedang Mengalirkan Air..."
                : isCupReady
                ? `Tuang Sekarang (${selectedVolume} ml)`
                : `Siapkan Takaran (${selectedVolume} ml) — Otomatis Saat Cangkir Ditaruh`}
            </span>
          </button>

          <button
            type="button"
            onClick={handleEmergencyStop}
            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded text-sm transition"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>STOP DARURAT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
