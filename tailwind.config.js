/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./bin/**/*.ml",
    "./lib/**/*.ml",
    "./lib/**/*.re",
    "./frontend/game-of-life.js"
  ],
  theme: {
    extend: {},
  },
  plugins: []
}