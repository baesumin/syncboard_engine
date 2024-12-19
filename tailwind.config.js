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
        "blink-twice": "blink 0.5s 2",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
