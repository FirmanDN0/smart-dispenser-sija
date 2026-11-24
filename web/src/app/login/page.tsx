"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGISTERED_STUDENTS } from "@/lib/constants";
import { Lock, UserCheck, AlertCircle, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState(REGISTERED_STUDENTS[0]?.id || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("PIN harus tepat 4 digit angka.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal melakukan login.");
        setPin("");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Gagal terhubung ke server autentikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-12">
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-[#112D4E] text-white flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Otentikasi Siswa</h2>
          <p className="text-xs text-slate-500 mt-1">
            Sistem Dispenser Pintar &bull; Uji Kenaikan Level (UKL 3) SMK Telkom Sidoarjo
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Nama Siswa
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setPin("");
                setError(null);
              }}
              className="w-full text-sm border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#112D4E]"
            >
              {REGISTERED_STUDENTS.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.nis}) &bull; {student.class}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Masukkan 4-Digit PIN
            </label>
            <div className="flex justify-center space-x-3 mb-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-11 h-12 rounded border flex items-center justify-center font-mono text-lg font-bold transition-all ${
                    pin[index]
                      ? "border-slate-800 bg-slate-900 text-white"
                      : "border-slate-300 bg-slate-50 text-transparent"
                  }`}
                >
                  {pin[index] ? "&bull;" : ""}
                </div>
              ))}
            </div>

            {/* Keypad for Lab Touchscreen / Convenience */}
            <div className="grid grid-cols-3 gap-2 mt-4 max-w-[260px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "Del"].map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    if (key === "C") handleClear();
                    else if (key === "Del") handleBackspace();
                    else handleDigitClick(key);
                  }}
                  className="h-10 text-sm font-mono font-semibold border border-slate-200 rounded bg-slate-50 hover:bg-slate-100 text-slate-800 active:bg-slate-200"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || pin.length !== 4}
            className="w-full mt-4 flex items-center justify-center space-x-2 bg-[#112D4E] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>{isLoading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-start space-x-2">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>
            PIN default untuk pengujian lab sekolah adalah <span className="font-mono font-bold text-slate-700">1234</span>. PIN diverifikasi secara aman pada server (Server-Side Hash Validation).
          </p>
        </div>
      </div>
    </div>
  );
}
