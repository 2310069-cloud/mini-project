/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // Base surfaces - near-black charcoal enterprise palette
        surface: {
          0: '#0a0c10',   // app background
          1: '#0d1016',   // sidebar / panels
          2: '#11151c',   // cards
          3: '#161b23',   // elevated cards / hover
          4: '#1c222b',   // inputs / nested
          border: '#232932',
          borderLight: '#2b323d',
        },
        // Severity palette - restrained, functional
        sev: {
          critical: '#e5484d',
          criticalBg: 'rgba(229,72,77,0.12)',
          high: '#f0883e',
          highBg: 'rgba(240,136,62,0.12)',
          medium: '#e8b339',
          mediumBg: 'rgba(232,179,57,0.12)',
          low: '#4c9aff',
          lowBg: 'rgba(76,154,255,0.12)',
          info: '#8b96a5',
          infoBg: 'rgba(139,150,165,0.12)',
        },
        status: {
          success: '#3fb950',
          successBg: 'rgba(63,185,80,0.12)',
          danger: '#e5484d',
          warn: '#e8b339',
        },
        accent: {
          DEFAULT: '#3b82f6',
          dim: '#2563eb',
          glow: 'rgba(59,130,246,0.15)',
        },
        text: {
          primary: '#e6e9ef',
          secondary: '#9aa4b2',
          muted: '#5f6b7a',
        }
      },
      fontSize: {
        xxs: ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(255,255,255,0.03), 0 4px 12px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1.4s step-start infinite',
      },
      keyframes: {
        blink: {
          '50%': { opacity: '0.3' }
        }
      }
    },
  },
  plugins: [],
}
