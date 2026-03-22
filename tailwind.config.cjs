module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        board: '#eef2ff',
        ink: '#0f172a',
        accent: '#2563eb',
        accentSoft: '#dbeafe',
        surface: '#ffffff',
        line: '#cbd5e1'
      },
      boxShadow: {
        card: '0 14px 30px -18px rgba(15, 23, 42, 0.35)'
      }
    }
  },
  plugins: []
}
