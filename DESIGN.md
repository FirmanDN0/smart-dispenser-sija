# DESIGN SYSTEM & SPECIFICATION — SMART DISPENSER IoT

## Identity & Design Read (Antislop Compliant)
- **Product**: Smart Dispenser IoT — Automated Drinking Water Station for SMK Telkom Sidoarjo Grade XII SIJA UKL 3.
- **Audience**: Vocational High School Students, Teachers/Examiners (Bu Ike, Pak Indra, Bu Rizka), and Lab Technicians.
- **Mood**: Industrial Precision, Safety-Critical Clarity, Trustworthy Laboratory Dashboard.
- **Dials**:
  - ENERGY: 2 (Restrained, functional utility, clear status badges, calm telemetry)
  - RHYTHM: 2 (Structured grid for telemetry, prominent primary dispensing control)
  - MOTION: 1 (Subtle functional transitions for flow/pulse telemetry and alert banners; zero gratuitous bouncy animations)

## Color Palette
Strictly following antislop principles (capped active palette, zero default AI gradients):
- **Base Canvas**: `#F8FAFC` (Tailwind `slate-50`)
- **Card & Panel Surfaces**: `#FFFFFF` with 1px border `#E2E8F0` (`slate-200`)
- **Primary Navy**: `#112D4E` (Headings, primary branding, navigation active state)
- **Primary Action Blue**: `#2563EB` (Start Dispense, key interactive triggers)
- **Status Green (AMAN / Normal)**: `#15803D` (`emerald-700`)
- **Status Amber (WARNING / AIR_RENDAH)**: `#D97706` (`amber-600`)
- **Status Red (DANGER / TUMPAHAN / STOP)**: `#DC2626` (`red-600`)
- **Telemetry Text**: `#0F172A` (`slate-900`) and `#475569` (`slate-600`)

## Typography & Hierarchy
- **Body & Headings**: Inter / Geist Sans (`font-sans`), clean hierarchy with readable weights (400, 500, 600, 700).
- **Telemetry & Numbers**: Monospace (`font-mono`, e.g., JetBrains Mono / ui-monospace) for all numerical values:
  - Cup distance: `XX.X cm`
  - Reservoir level: `XX %`
  - Flow pulses: `XXXX pulses`
  - Dispensed volume: `XXX ml`
  - Spill ADC: `XXXX (0-4095)`
  - Timestamps: ISO8601 formatted cleanly.

## Component Principles
- **Elevations**: Flat or 1px border (`border-slate-200`). Elevation shadow used ONLY on active modals or sticky controls.
- **Radii**: Small, purposeful radii: `rounded-md` (6px) or `rounded-lg` (8px). No pill-shaped everything.
- **Telemetry Cards**: Compact, high-density, legible labels, immediate visual state indicators (pill badges with semantic background/text).
- **Safety Over Cloud**: Cloud state is displayed with clear latency indicators. The physical emergency STOP is prominently signaled.
- **State Fidelity**: Distinct states for Idle, Dispensing, Warning, Emergency Stop, and Offline.
