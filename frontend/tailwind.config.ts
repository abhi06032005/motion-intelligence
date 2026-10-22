import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        app: "#F0F1F3",
        "card-white": "#FFFFFF",
        "primary-text": "#202226",
        "secondary-text": "#8E9399",
        mint: "#D9F0EC",
        aqua: "#EAF7F5",
        lavender: "#EDE2F2",
        "pink-soft": "#F6E8F1",
        "chart-inactive": "#E7EAEC",
        "chart-active": "#25292A",
        "subtle-border": "#E9EBED",
        "dark-card": "#202223",
      },
      borderRadius: {
        "2xl": "1.25rem", // 20px
        "3xl": "1.75rem", // 28px
        "4xl": "2rem",    // 32px
      },
    },
  },
  plugins: [],
} satisfies Config;
