"use client";

import { useState, useEffect } from "react";
import { Wrench, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface DiagnosticsResult {
  status: string;
  timestamp: number;
  environment: {
    allConfigured: boolean;
    details: Record<string, boolean>;
  };
  firebaseAdmin: {
    isInitialized: boolean;
    rtdbConnected: boolean;
    rtdbError: string | null;
  };
  device: {
    deviceId: string;
    lastSeen: number | null;
    isRecentlyOnline: boolean;
  };
}

export default function SetupPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/setup/diagnostics");
      const data = await res.json();
      setDiagnostics(data);
    } catch {
      setDiagnostics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Asisten Setup & Diagnostik Laboratorium
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Alat verifikasi mandiri untuk siswa dan guru penguji UKL 3 SMK Telkom Sidoarjo.
          </p>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center space-x-1.5 text-xs bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded font-mono text-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Uji Ulang</span>
        </button>
      </div>

      {loading && !diagnostics && (
        <div className="p-8 text-center text-xs font-mono text-slate-500">
          Menjalankan uji konektivitas komponen cloud dan perangkat...
        </div>
      )}

      {diagnostics && (
        <div className="space-y-4">
          {/* Environment Variables Audit */}
          <div className="bg-white border border-slate-200 rounded-md p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              1. Verifikasi Environment Variables (.env.local)
            </h3>
            <div className="divide-y divide-slate-100 text-xs font-mono">
              {Object.entries(diagnostics.environment.details).map(([key, configured]) => (
                <div key={key} className="py-2 flex items-center justify-between">
                  <span className="text-slate-600">{key}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center space-x-1 ${
                      configured
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {configured ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{configured ? "TERPASANG" : "BELUM ADA"}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Firebase Connection Audit */}
          <div className="bg-white border border-slate-200 rounded-md p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              2. Konektivitas Firebase Realtime Database
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Inisialisasi Firebase Admin:</span>
                <span
                  className={
                    diagnostics.firebaseAdmin.isInitialized
                      ? "text-emerald-700 font-semibold"
                      : "text-amber-600"
                  }
                >
                  {diagnostics.firebaseAdmin.isInitialized
                    ? "BERHASIL (Ready)"
                    : "MENUNGGU KREDENSIAL"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Koneksi Realtime Database:</span>
                <span
                  className={
                    diagnostics.firebaseAdmin.rtdbConnected
                      ? "text-emerald-700 font-semibold"
                      : "text-slate-500"
                  }
                >
                  {diagnostics.firebaseAdmin.rtdbConnected
                    ? "TERHUBUNG (Bisa Baca/Tulis)"
                    : "MODE LOKAL / SIMULASI"}
                </span>
              </div>
            </div>
          </div>

          {/* Hardware ESP32 Presence Audit */}
          <div className="bg-white border border-slate-200 rounded-md p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              3. Status Sinyal ESP32 (dispenser01)
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Koneksi Hardware Terakhir:</span>
                <span className="text-slate-800 font-semibold">
                  {diagnostics.device.lastSeen
                    ? new Date(diagnostics.device.lastSeen).toLocaleString("id-ID")
                    : "Belum pernah mengirim telemetri"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Status Aktif Saat Ini:</span>
                <span
                  className={
                    diagnostics.device.isRecentlyOnline
                      ? "text-emerald-700 font-semibold"
                      : "text-amber-600"
                  }
                >
                  {diagnostics.device.isRecentlyOnline ? "ONLINE (< 10s lalu)" : "STANDBY / OFFLINE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
