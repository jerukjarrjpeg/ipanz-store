import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#0A8A4A",
          greenDark: "#077038",
          greenSoft: "#E6F5EC",
          orange: "#F58220",
          orangeSoft: "#FFF0E1",
          red: "#E4302B",
          redSoft: "#FDECEB",
          bg: "#F5F5F7",
        },
        ink: { DEFAULT: "#1D1D1F", mute: "#6E6E73" },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Inter", "Segoe UI",
          "Roboto", "Helvetica Neue", "Arial", "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,.04), 0 8px 24px -8px rgba(0,0,0,.10)",
        lift: "0 2px 4px rgba(0,0,0,.05), 0 16px 40px -12px rgba(0,0,0,.18)",
      },
      keyframes: {
        pop: { "0%": { transform: "scale(.6)" }, "70%": { transform: "scale(1.15)" }, "100%": { transform: "scale(1)" } },
        rise: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { pop: "pop .25s ease-out", rise: "rise .45s ease-out both" },
    },
  },
  plugins: [],
};

export default config;
