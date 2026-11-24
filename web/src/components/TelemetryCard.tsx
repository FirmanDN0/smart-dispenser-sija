import React from "react";

interface TelemetryCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  badge?: {
    text: string;
    type: "safe" | "warning" | "danger" | "neutral";
  };
  icon?: React.ReactNode;
}

export default function TelemetryCard({
  label,
  value,
  unit,
  subtext,
  badge,
  icon,
}: TelemetryCardProps) {
  const badgeClasses = {
    safe: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-1.5 my-1">
        <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-500">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
        <span className="text-slate-500 text-[11px] truncate max-w-[160px]">{subtext || "—"}</span>
        {badge && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
              badgeClasses[badge.type]
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
