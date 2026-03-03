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
        enrollment: { DEFAULT: "#2563eb", light: "#dbeafe" },
        marketing: { DEFAULT: "#7c3aed", light: "#ede9fe" },
        academic: { DEFAULT: "#059669", light: "#d1fae5" },
        "student-success": { DEFAULT: "#d97706", light: "#fef3c7" },
        finance: { DEFAULT: "#dc2626", light: "#fee2e2" },
        hr: { DEFAULT: "#0891b2", light: "#cffafe" },
        it: { DEFAULT: "#4b5563", light: "#f3f4f6" },
      },
    },
  },
  plugins: [],
};
export default config;
