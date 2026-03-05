import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-ibm-plex)", "IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        heading: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        terminal: {
          bg: "#FAFAF8",
          surface: "#F5F3EF",
          dark: "#2D2A24",
          titlebar: "#3D3930",
          border: "#E8E5DF",
        },
        accent: {
          DEFAULT: "#D4652E",
          hover: "#BD5927",
          light: "#E07A2F",
        },
        success: "#7EB77F",
        warning: "#E8C547",
        traffic: {
          red: "#FF5F57",
          yellow: "#FEBC2E",
          green: "#28C840",
        },
        muted: "#6B6459",
        tertiary: "#9B9485",
      },
    },
  },
  plugins: [],
};
export default config;
