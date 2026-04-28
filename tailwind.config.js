/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        gold: '#C89650',
        green: '#4A7045',
        red: '#b84040',
        surface: 'rgba(255,255,255,0.02)',
        't1': '#e8e4dc',
        't2': '#b0aca6',
        't3': '#6e6a66',
        't4': '#4a4845',
      },
      backdropBlur: {
        glass: '24px',
        'glass-sm': '16px',
      },
      boxShadow: {
        'glass': '0 1px 0 rgba(255,255,255,0.07) inset, 0 8px 32px rgba(0,0,0,0.45)',
        'glass-hover': '0 1px 0 rgba(255,255,255,0.10) inset, 0 20px 60px rgba(0,0,0,0.55)',
        'gold-glow': '0 0 24px rgba(200,150,80,0.35), 0 4px 16px rgba(200,150,80,0.18)',
        'gold-glow-lg': '0 0 36px rgba(200,150,80,0.5), 0 8px 24px rgba(200,150,80,0.25)',
        'neon': '0 0 8px currentColor',
        'card-float': '0 24px 56px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.35)',
      },
      animation: {
        'ambient1': 'ambientDrift1 18s ease-in-out infinite alternate',
        'ambient2': 'ambientDrift2 22s ease-in-out infinite alternate',
        'flowing-border': 'flowingBorder 3s ease infinite',
        'chart-draw': 'chartDraw 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
        'result-in': 'resultFadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'gauge-in': 'gaugeIn 0.9s cubic-bezier(0.16,1,0.3,1) both',
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        ambientDrift1: {
          'from': { transform: 'translate(0,0) scale(1)' },
          'to':   { transform: 'translate(6%,4%) scale(1.08)' },
        },
        ambientDrift2: {
          'from': { transform: 'translate(0,0) scale(1)' },
          'to':   { transform: 'translate(-5%,-3%) scale(1.06)' },
        },
        flowingBorder: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        chartDraw: {
          'to': { strokeDashoffset: '0' },
        },
        resultFadeIn: {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        gaugeIn: {
          'from': { transform: 'scaleX(0)' },
          'to':   { transform: 'scaleX(1)' },
        },
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(20px)' },
          'to':   { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.7' },
          '50%':     { opacity: '1' },
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'Pretendard Std', 'sans-serif'],
        data: ['Inter', 'IBM Plex Mono', 'monospace'],
      },
      backgroundImage: {
        'mesh-blue':   'radial-gradient(ellipse at center, rgba(16,24,54,0.55) 0%, transparent 70%)',
        'mesh-gold':   'radial-gradient(ellipse at center, rgba(40,28,8,0.45) 0%, transparent 70%)',
        'edge-light':  'linear-gradient(to bottom, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)',
        'inner-glow':  'linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 100%)',
        'btn-gold':    'linear-gradient(135deg, #d4a255 0%, #C89650 50%, #b8823a 100%)',
        'flowing':     'linear-gradient(90deg, #C89650, #6ea8c8, #9a7ac8, #C89650)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};
