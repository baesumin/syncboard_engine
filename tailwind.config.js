/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        blink: {
          "0%, 100%": { backgroundColor: "#EEEFF3" },
          "50%": { backgroundColor: "#FFBB00" },
        },
      },
      animation: {
        "blink-once": "blink 0.5s 1",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
