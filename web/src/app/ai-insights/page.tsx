"use client";

import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { AI_RULE_EXPLANATIONS } from "@/lib/constants";
import { ShieldCheck, AlertTriangle, Cpu, CheckCircle2, ListOrdered, FileText } from "lucide-react";

export default function AIInsightsPage() {
  const { telemetry } = useDeviceTelemetry();
  const currentExplanation = AI_RULE_EXPLANATIONS[telemetry.ai_classification];

  const rulesTable = [
    { priority: 1, label: "SENSOR_ERROR", condition: "Jarak ultrasonik < 0 atau kabel terputus", risk: "HIGH", action: "Hentikan sistem, periksa wiring" },
    { priority: 2, label: "TUMPAHAN", condition: "Baki ADC >= 1200", risk: "CRITICAL", action: "Matikan pompa segera, alarm buzzer" },
    { priority: 3, label: "GELAS_TIDAK_ADA (Pompa Aktif)", condition: "Pompa menyala DAN cangkir terangkat", risk: "CRITICAL", action: "Emergency shutdown pompa, catat pelanggaran" },
    { priority: 4, label: "ALIRAN_BERMASALAH", condition: "Pompa menyala DAN tidak ada pulsa > 2.5s", risk: "HIGH", action: "Matikan pompa, cegah dry run" },
    { priority: 5, label: "AIR_RENDAH", condition: "Level tandon <= 20%", risk: "MEDIUM", action: "Kunci perintah pengisian, beri peringatan" },
    { priority: 6, label: "GELAS_TIDAK_ADA (Siaga)", condition: "Pompa mati DAN cangkir tidak ada", risk: "LOW", action: "Tunggu penempatan cangkir" },
    { priority: 7, label: "AMAN", condition: "Semua sensor berada di rentang normal", risk: "LOW", action: "Sistem siap melayani dispensing" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Pusat Kecerdasan Artifisial (AI Decision Engine)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Sistem inferensi rule-based yang dapat dijelaskan (Explainable AI) berjalan secara lokal pada mikrokontroler ESP32.
        </p>
      </div>

      {/* Current Realtime Classification Card */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Inferensi AI Terkini (Realtime)
            </h3>
          </div>
          <span
            className={`text-xs font-mono px-2.5 py-1 rounded border font-semibold ${
              telemetry.ai_classification === "AMAN"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : telemetry.ai_classification === "AIR_RENDAH"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            KELAS: {telemetry.ai_classification}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 block uppercase tracking-wider font-semibold">Tingkat Risiko</span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
              {telemetry.ai_risk_level}
            </span>
          </div>
          <div className="md:col-span-2">
            <span className="text-slate-500 block uppercase tracking-wider font-semibold">Rekomendasi Tindakan</span>
            <span className="text-slate-800 font-medium mt-0.5 block">
              {currentExplanation?.advice || "Ikuti petunjuk pada indikator visual."}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-xs font-semibold text-slate-600 block mb-1">Bukti Data Sensor (Evidence):</span>
          <p className="text-xs text-slate-700 font-mono bg-white p-3 rounded border border-slate-200 leading-relaxed">
            {telemetry.ai_explanation}
          </p>
        </div>
      </div>

      {/* Decision Rules Hierarchy Table */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ListOrdered className="w-4 h-4 text-slate-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Prioritas Aturan Keputusan (Decision Rules Hierarchy)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase font-mono">
              <tr>
                <th className="py-2.5 px-3">Prioritas</th>
                <th className="py-2.5 px-3">Kelas Target</th>
                <th className="py-2.5 px-3">Kondisi Fitur Sensor</th>
                <th className="py-2.5 px-3">Risiko</th>
                <th className="py-2.5 px-3">Tindakan Sistem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {rulesTable.map((r) => (
                <tr
                  key={r.priority}
                  className={telemetry.ai_classification === r.label ? "bg-blue-50/70 font-semibold" : "hover:bg-slate-50"}
                >
                  <td className="py-2.5 px-3">{r.priority}</td>
                  <td className="py-2.5 px-3 text-[#112D4E]">{r.label}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">{r.condition}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        r.risk === "CRITICAL"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : r.risk === "HIGH"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {r.risk}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
