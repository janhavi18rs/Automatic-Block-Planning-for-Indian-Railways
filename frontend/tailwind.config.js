/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stage: {
          blue: "#2563eb",   // Stage 1 Data Ingestion
          purple: "#7c3aed", // Stage 2 AI Decision Core
          amber: "#ea580c",  // Stage 3 Dual-Horizon Planning
          teal: "#0d9488",   // Stage 4 Closed-Loop Execution
        },
        ops: {
          bg: "#080c14",
          card: "#0f172a",
          hover: "#1e293b",
          border: "#1e293b",
          subtle: "#334155",
          accent: "#38bdf8",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
