import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Court blue scale (§9.2)
        court: {
          50: "#EDF1FD",
          100: "#D9E2FA",
          200: "#B3C4F4",
          300: "#859FEB",
          400: "#5578DE",
          500: "#2F57CC",
          600: "#1D3DB8",
          700: "#173195",
          800: "#122774",
          900: "#0E1D57",
          950: "#070D28",
        },
        // Racket coral scale
        racket: {
          400: "#FF8A63",
          500: "#FF6A3D",
          600: "#E9521F",
        },
        // Semantic colors via CSS variables (R G B format for alpha support)
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        mist: "#F3F5FB",
        // Slot states
        "slot-booked": "#FBD9D5",
        "slot-booked-text": "#8A1C12",
        "slot-locked": "#E6E9F2",
        "slot-event": "#E7DBFF",
        "slot-event-text": "#4A1D96",
        "slot-held": "#FFEFB8",
        "slot-held-text": "#6B4E00",
        // Semantic status
        success: "#0F7B5F",
        danger: "#C42B1C",
        warning: "#8A5A00",
      },
      borderRadius: {
        container: "20px",
        card: "12px",
        control: "10px",
        slot: "6px",
      },
      fontFamily: {
        sans: ["var(--font-bvp)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "72rem", // max-w-6xl equivalent
      },
    },
  },
  plugins: [],
};
export default config;
