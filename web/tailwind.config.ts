import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F8FAFC",
        navy: {
          DEFAULT: "#112D4E",
          900: "#0B1D33",
          800: "#112D4E",
          700: "#1A3E66",
        },
        action: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
        telemetry: {
          safe: "#15803D",
          warning: "#D97706",
          danger: "#DC2626",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
