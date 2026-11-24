"use client";

import { useState } from "react";
import { History, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { DispenseLog } from "@/types";

export default function HistoryPage() {
  const [logs] = useState<DispenseLog[]>([
    {
      id: "log_101",
      device_id: "dispenser01",
      user_id: "student_01",
      student_name: "Ahmad Fauzi",
      requested_volume_ml: 200,
      measured_volume_ml: 200,
      flow_pulses: 240,
      duration_ms: 8100,
      status: "COMPLETED",
      timestamp: Date.now() - 15 * 60 * 1000,
    },
    {
      id: "log_102",
      device_id: "dispenser01",
      user_id: "student_02",
      student_name: "Bunga Citra",
      requested_volume_ml: 100,
      measured_volume_ml: 100,
      flow_pulses: 120,
      duration_ms: 4100,
      status: "COMPLETED",
      timestamp: Date.now() - 45 * 60 * 1000,
    },
    {
      id: "log_103",
      device_id: "dispenser01",
      user_id: "student_03",
      student_name: "Dimas Pratama",
      requested_volume_ml: 300,
      measured_volume_ml: 95,
      flow_pulses: 114,
      duration_ms: 3800,
      status: "INTERRUPTED",
      timestamp: Date.now() - 90 * 60 * 1000,
    },
    {
      id: "log_104",
      device_id: "dispenser01",
      user_id: "student_01",
      student_name: "Ahmad Fauzi",
      requested_volume_ml: 200,
      measured_volume_ml: 200,
      flow_pulses: 240,
      duration_ms: 8050,
      status: "COMPLETED",
      timestamp: Date.now() - 180 * 60 * 1000,
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Riwayat Pengambilan Air Minum
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Catatan operasional aktual tersimpan di Firebase Realtime Database.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase font-mono">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Target (ml)</th>
                <th className="py-3 px-4">Terukur (ml)</th>
                <th className="py-3 px-4">Pulsa YF-S201</th>
                <th className="py-3 px-4">Durasi</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    {log.student_name}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{log.requested_volume_ml} ml</td>
                  <td className="py-3 px-4 text-slate-900 font-bold">{log.measured_volume_ml} ml</td>
                  <td className="py-3 px-4 text-slate-600">{log.flow_pulses}</td>
                  <td className="py-3 px-4 text-slate-600">{(log.duration_ms / 1000).toFixed(1)}s</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border inline-flex items-center space-x-1 ${
                        log.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {log.status === "COMPLETED" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>{log.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
