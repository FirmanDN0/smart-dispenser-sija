import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Smart Dispenser IoT | XII SIJA UKL 3",
  description: "Automated Drinking Water Station & AI Hydration Controller - SMK Telkom Sidoarjo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>SMK Telkom Sidoarjo &bull; Uji Kenaikan Level (UKL) 3 &bull; Kelas XII SIJA</span>
            <span className="font-mono text-slate-400">ESP32 + MicroPython + Firebase RTDB</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
