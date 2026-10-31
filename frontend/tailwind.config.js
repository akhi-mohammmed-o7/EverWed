/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#173B32",
          50: "#E8F0EE",
          100: "#C8DAD5",
          200: "#9FBFB7",
          300: "#6FA398",
          400: "#468A7E",
          500: "#2E6E62",
          600: "#24574D",
          700: "#1E4840",
          800: "#173B32",
          900: "#0E261F",
          950: "#071410",
        },
        gold: {
          DEFAULT: "#D7B875",
          50: "#FDF9F0",
          100: "#F8F0D9",
          200: "#F2E3B5",
          300: "#EBD391",
          400: "#E4C57E",
          500: "#D7B875",
          600: "#C99E4F",
          700: "#A87E38",
          800: "#856028",
          900: "#5E431B",
          950: "#3D2B0E",
        },
        ivory: {
          DEFAULT: "#F7F3EC",
          50: "#FDFCF9",
          100: "#FAF8F3",
          200: "#F7F3EC",
          300: "#EFE8D9",
          400: "#E6DAC4",
          500: "#DBCAAD",
          600: "#C8AE88",
          700: "#A88D60",
          800: "#856D44",
          900: "#5E4D2F",
          950: "#3D311C",
        },
        terracotta: {
          DEFAULT: "#B85C52",
          50: "#FAF0EF",
          100: "#F5D9D6",
          200: "#EDADA8",
          300: "#E48079",
          400: "#D86D64",
          500: "#C96159",
          600: "#B85C52",
          700: "#9B4A42",
          800: "#7A3935",
          900: "#562624",
          950: "#3A1917",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      backgroundImage: {
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)",
      },
    },
  },
  plugins: [],
};

