"use client";

import { useState } from "react";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { DISPENSE_PRESETS } from "@/lib/constants";
import { Droplet, AlertOctagon, CheckCircle2, Clock, AlertTriangle, Play } from "lucide-react";

export default function DispensePage() {
  const { telemetry, deviceState } = useDeviceTelemetry();
  const [selectedVolume, setSelectedVolume] = useState<number>(200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Check hardware pre-conditions
  const isCupReady = telemetry.cup_detected;
  const isTankSufficient = telemetry.reservoir_percentage > 10;
  const isTrayDry = !telemetry.spill_detected;
  const canStart = isCupReady && isTankSufficient && isTrayDry && !telemetry.pump_running;

  const handleStartDispense = async () => {
    setIsSubmitting(true);
    setCommandFeedback({ type: "info", message: "Mengirimkan perintah ke cloud..." });

    try {
      const res = await fetch("/api/dispense/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeMl: selectedVolume }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCommandFeedback({ type: "error", message: data.error || "Gagal memulai pengisian air." });
      } else {
        setCommandFeedback({
          type: "success",
          message: data.message || "Perintah berhasil dikirim ke antrean ESP32.",
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
        message: "Perintah STOP darurat telah dikirimkan ke cloud.",
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
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {isCupReady ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
            <div>
              <p className="font-semibold">{isCupReady ? "Cangkir Terdeteksi" : "Cangkir Tidak Ada"}</p>
              <p className="text-[10px] font-mono">{telemetry.cup_distance_cm} cm</p>
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
              onClick={() => setSelectedVolume(vol)}
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

        {/* Realtime Dispensing Progress Bar (Active when pump running) */}
        {telemetry.pump_running && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-blue-700 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                <span>Pompa Aktif: Mengisi Air...</span>
              </span>
              <span className="font-mono text-slate-800 font-semibold">
                {telemetry.measured_volume_ml} / {selectedVolume} ml
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-[#2563EB] h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((telemetry.measured_volume_ml / selectedVolume) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1.5">
              <span>Sensor Pulsa: {telemetry.flow_pulses} pulses</span>
              <span>Relay IN (GPIO 26): ACTIVE</span>
            </div>
          </div>
        )}

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

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={!canStart || isSubmitting}
            onClick={handleStartDispense}
            className="flex-1 flex items-center justify-center space-x-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 px-6 rounded text-sm transition"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Mulai Pengisian ({selectedVolume} ml)</span>
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
