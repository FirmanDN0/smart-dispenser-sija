"use client";

import { useState, useEffect } from "react";
import { Settings, Save, ToggleLeft, ToggleRight, Info } from "lucide-react";

export default function SettingsPage() {
  const [dailyGoal, setDailyGoal] = useState(1500);
  const [simMode, setSimMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sija_sim_mode") === "true";
    setSimMode(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem("sija_sim_mode", simMode ? "true" : "false");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    // Reload page to apply mode change across hooks
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h2>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi target hidrasi pribadi dan pengalihan mode operasi perangkat.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Target Konsumsi Air Harian (ml)
          </label>
          <input
            type="number"
            step="50"
            min="500"
            max="4000"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full text-sm font-mono border border-slate-300 rounded px-3 py-2 text-slate-900"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Rekomendasi standar Kementerian Kesehatan RI untuk remaja/dewasa adalah 1500 - 2000 ml per hari.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Mode Simulasi (Tanpa Hardware Fisik)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Aktifkan untuk menguji antarmuka dan logika AI tanpa terhubung ke mikrokontroler ESP32 fisik.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSimMode(!simMode)}
            className="text-slate-700 focus:outline-none"
          >
            {simMode ? (
              <ToggleRight className="w-10 h-10 text-amber-600" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-300" />
            )}
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">
            Pengaturan berhasil disimpan.
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="w-full flex items-center justify-center space-x-2 bg-[#112D4E] hover:bg-slate-800 text-white font-semibold py-2.5 rounded text-xs transition"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>
    </div>
  );
}
