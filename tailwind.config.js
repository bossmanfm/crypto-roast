/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0f',
        card: '#12121a',
        accent: '#6366f1',
        'accent-hover': '#4f46e5',
        roast: '#ef4444',
        degen: '#f59e0b',
        whale: '#10b981',
        paper: '#6b7280',
      },
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}
