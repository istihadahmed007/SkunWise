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
        // Medical Reference Template Palette
        "med-teal": {
          DEFAULT: "#4da8b9",
          hover: "#3a96a7",
          dark: "#2b7f8f",
          light: "#e6f5f7",
          subtle: "#f0f9fa",
        },
        "med-ice": {
          light: "#f4fafc",
          DEFAULT: "#e8f4f8",
          dark: "#d9ecf3",
          border: "#cce4ee",
        },
        "med-navy": {
          DEFAULT: "#1c2834",
          light: "#2d3c4d",
          muted: "#526373",
        },
        // Existing tokens preserved for full compatibility
        "primary": "#4da8b9",
        "primary-dark": "#368a99",
        "primary-container": "#4da8b9",
        "on-primary": "#ffffff",
        "secondary": "#006591",
        "secondary-container": "#39b8fd",
        "tertiary": "#006948",
        "surface": "#e8f4f8",
        "on-surface": "#1c2834",
        "on-surface-variant": "#526373",
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
        "5xl": "40px",
        "6xl": "48px",
      },
      boxShadow: {
        "med-card": "0 12px 32px -8px rgba(160, 205, 222, 0.4)",
        "med-card-hover": "0 20px 40px -10px rgba(140, 195, 215, 0.5)",
        "med-glass": "0 8px 32px 0 rgba(140, 190, 210, 0.2)",
        "med-pill": "0 4px 16px rgba(77, 168, 185, 0.3)",
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
