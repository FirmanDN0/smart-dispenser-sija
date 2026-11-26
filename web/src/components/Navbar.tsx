"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Droplet, 
  Activity, 
  Cpu, 
  History, 
  Trophy, 
  Settings, 
  LogOut, 
  User, 
  Wrench,
  Wifi,
  WifiOff,
  Clock
} from "lucide-react";

interface StudentSession {
  id: string;
  name: string;
  class: string;
  daily_goal_ml: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState<StudentSession | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [clockStr, setClockStr] = useState<string>("");

  useEffect(() => {
    // Live ticking clock
    const updateClock = () => setClockStr(new Date().toLocaleTimeString("id-ID"));
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    // Check session on load
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setStudent(data.student);
        } else {
          setStudent(null);
        }
      })
      .catch(() => setStudent(null));

    // Check simulated mode flag from localStorage
    const savedSim = localStorage.getItem("sija_sim_mode") === "true";
    setIsSimulated(savedSim);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setStudent(null);
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/dispense", label: "Ambil Air", icon: Droplet },
    { href: "/monitoring", label: "Sensor", icon: Cpu },
    { href: "/ai-insights", label: "AI Insights", icon: Activity },
    { href: "/history", label: "Riwayat", icon: History },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/setup", label: "Setup / Uji", icon: Wrench },
    { href: "/settings", label: "Pengaturan", icon: Settings },
  ];

  if (pathname === "/login") {
    return (
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded bg-navy-800 flex items-center justify-center text-white font-bold text-sm">
              SD
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 leading-tight">SMART DISPENSER IoT</h1>
              <p className="text-xs text-slate-500 font-mono">SMK Telkom Sidoarjo &bull; XII SIJA</p>
            </div>
          </div>
          <Link
            href="/setup"
            className="text-xs font-mono text-slate-600 hover:text-slate-900 flex items-center space-x-1 border border-slate-200 px-2.5 py-1 rounded"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Diagnostik Lab</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2.5">
              <div className="h-7 w-7 rounded bg-[#112D4E] flex items-center justify-center text-white font-semibold text-xs">
                SD
              </div>
              <span className="font-semibold text-sm tracking-tight text-slate-900 hidden sm:inline">
                SMART DISPENSER
              </span>
            </Link>

            {/* Hardware / Simulation Mode Pill */}
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isSimulated
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isSimulated ? "SIMULASI" : "DEVICE LIVE"}
            </span>

            {/* Live Clock Badge */}
            {clockStr && (
              <span className="hidden lg:flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{clockStr} WIB</span>
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-slate-100 text-[#112D4E] font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Account / Session Controls */}
          <div className="flex items-center space-x-3">
            {student ? (
              <div className="flex items-center space-x-2 text-xs">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="font-semibold text-slate-800 leading-tight">{student.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{student.class}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Keluar / Ganti Siswa"
                  className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1 text-xs bg-[#112D4E] text-white px-3 py-1.5 rounded font-medium hover:bg-slate-800 transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk Siswa</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-2.5 py-1 text-xs whitespace-nowrap rounded ${
                  isActive
                    ? "bg-[#112D4E] text-white font-medium"
                    : "text-slate-600 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
