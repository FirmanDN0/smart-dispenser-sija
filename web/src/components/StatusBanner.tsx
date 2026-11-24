import { AlertTriangle, CheckCircle, XOctagon, WifiOff } from "lucide-react";
import { AIClassification, RiskLevel } from "@/types";

interface StatusBannerProps {
  classification: AIClassification;
  riskLevel: RiskLevel;
  explanation: string;
  isOnline: boolean;
  pumpRunning: boolean;
  spillDetected: boolean;
}

export default function StatusBanner({
  classification,
  riskLevel,
  explanation,
  isOnline,
  pumpRunning,
  spillDetected,
}: StatusBannerProps) {
  if (!isOnline) {
    return (
      <div className="border border-slate-300 bg-slate-100 rounded-md p-3.5 mb-6 flex items-center space-x-3 text-slate-800">
        <WifiOff className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-slate-900">Perangkat ESP32 Sedang Offline</p>
          <p className="text-slate-600">
            Terakhir kali telemetri diterima lebih dari 10 detik lalu. Periksa catu daya ESP32 dan koneksi Wi-Fi lab.
          </p>
        </div>
      </div>
    );
  }

  if (spillDetected || classification === "TUMPAHAN") {
    return (
      <div className="border border-red-300 bg-red-50 rounded-md p-3.5 mb-6 flex items-center space-x-3 text-red-900">
        <XOctagon className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-red-700 uppercase tracking-wide">
            DARURAT: TUMPAHAN AIR TERDETEKSI (AI RISK: CRITICAL)
          </p>
          <p className="text-red-800">{explanation}</p>
        </div>
      </div>
    );
  }

  if (pumpRunning) {
    return (
      <div className="border border-blue-300 bg-blue-50 rounded-md p-3.5 mb-6 flex items-center space-x-3 text-blue-900">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-blue-800">POMPA AIR AKTIF &bull; SEDANG MENGISI</p>
          <p className="text-blue-700">Sensor aliran YF-S201 aktif mengukur volume. Interlock keselamatan aktif.</p>
        </div>
      </div>
    );
  }

  if (classification === "AIR_RENDAH") {
    return (
      <div className="border border-amber-300 bg-amber-50 rounded-md p-3.5 mb-6 flex items-center space-x-3 text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-bold text-amber-800 uppercase">PERINGATAN: AIR TANDON RENDAH</p>
          <p className="text-amber-700">{explanation}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-emerald-200 bg-emerald-50/60 rounded-md p-3 mb-6 flex items-center space-x-3 text-emerald-900">
      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <div className="text-xs flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <span className="font-semibold text-emerald-800">Kondisi Operasional Normal: </span>
          <span className="text-emerald-700">{explanation}</span>
        </div>
        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded self-start sm:self-auto">
          AI: AMAN
        </span>
      </div>
    </div>
  );
}
