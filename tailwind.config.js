/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Use 'class' strategy so NativeWind does NOT automatically invert colors
  // based on the system media query — we manually control dark/light via ThemeProvider
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#a60df2",
      },
    },
  },
  plugins: [],
};
