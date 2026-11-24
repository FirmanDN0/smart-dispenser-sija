"use client";

import { Trophy, Award, ShieldAlert } from "lucide-react";
import { REGISTERED_STUDENTS } from "@/lib/constants";

export default function LeaderboardPage() {
  const studentsRanking = [
    { name: "Dimas Pratama", class: "XII SIJA 2", goalMl: 2000, dispensedMl: 1800, violations: 1 },
    { name: "Ahmad Fauzi", class: "XII SIJA 2", goalMl: 1500, dispensedMl: 1400, violations: 0 },
    { name: "Bunga Citra", class: "XII SIJA 2", goalMl: 1800, dispensedMl: 1500, violations: 0 },
    { name: "Nabila Putri", class: "XII SIJA 2", goalMl: 1600, dispensedMl: 1100, violations: 0 },
    { name: "Rizky Ramadhan", class: "XII SIJA 2", goalMl: 2200, dispensedMl: 900, violations: 0 },
  ].sort((a, b) => b.dispensedMl - a.dispensedMl);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Peringkat Hidrasi Siswa (Leaderboard)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Dihitung dari total volume aktual yang dikeluarkan dispenser untuk setiap akun siswa.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase font-mono">
            <tr>
              <th className="py-3 px-4">Peringkat</th>
              <th className="py-3 px-4">Nama Siswa</th>
              <th className="py-3 px-4">Kelas</th>
              <th className="py-3 px-4">Target Harian</th>
              <th className="py-3 px-4">Total Diambil</th>
              <th className="py-3 px-4">Pencapaian</th>
              <th className="py-3 px-4">Poin Pelanggaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {studentsRanking.map((s, idx) => {
              const pct = Math.round((s.dispensedMl / s.goalMl) * 100);
              return (
                <tr key={s.name} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                      {idx === 0 && <Award className="w-4 h-4 text-amber-500" />}
                      <span>#{idx + 1}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-500">{s.class}</td>
                  <td className="py-3 px-4 text-slate-700">{s.goalMl} ml</td>
                  <td className="py-3 px-4 font-bold text-[#112D4E]">{s.dispensedMl} ml</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="w-10">{pct}%</span>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#2563EB] h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {s.violations > 0 ? (
                      <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-semibold">
                        {s.violations} Insiden
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        0 (Tertib)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
