/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: 'hsl(var(--primary) / <alpha-value>)',
        'primary-foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
        secondary: 'hsl(var(--secondary) / <alpha-value>)',
        'secondary-foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
        destructive: 'hsl(var(--destructive) / <alpha-value>)',
        'destructive-foreground': 'hsl(var(--destructive-foreground) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        bronze: '#8b6f47',
        gold: '#d4a574',
        silver: '#a3a3a3',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        'sidebar-background': 'hsl(var(--sidebar-background) / <alpha-value>)',
        'sidebar-foreground': 'hsl(var(--sidebar-foreground) / <alpha-value>)',
        'sidebar-accent': 'hsl(var(--sidebar-accent) / <alpha-value>)',
      },
      borderRadius: {
        xs: '0.375rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Manrope', 'Segoe UI', 'sans-serif'],
      },
      minHeight: { touch: '44px' },
      minWidth:  { touch: '44px' },
      boxShadow: {
        'glow':        '0 0 18px 4px hsl(185 73% 26% / 0.28)',
        'glow-accent': '0 0 18px 4px hsl(24 75% 58% / 0.32)',
        'glow-sm':     '0 0 10px 2px hsl(185 73% 26% / 0.22)',
        'card':        '0 4px 24px -4px rgba(20,44,50,0.10), 0 1px 4px rgba(20,44,50,0.06)',
        'card-hover':  '0 20px 56px -8px rgba(20,44,50,0.18), 0 4px 12px rgba(20,44,50,0.08)',
        'dialog':      '0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)',
        'sidebar-item':'0 4px 16px rgba(247,184,113,0.38)',
        'btn-primary': '0 6px 20px hsl(185 73% 26% / 0.35)',
        'btn-hover':   '0 10px 28px hsl(185 73% 26% / 0.45)',
        'btn-accent':  '0 6px 20px hsl(24 75% 58% / 0.38)',
      },
      backgroundImage: {
        'shimmer': 'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.28) 50%, transparent 62%)',
        'gradient-primary': 'linear-gradient(135deg, hsl(185 73% 26%), hsl(185 60% 20%))',
        'gradient-gold':    'linear-gradient(135deg, #c4956a, #f7b871, #d4a574)',
        'gradient-hero':    'linear-gradient(135deg, #0d2226 0%, #0a4f57 50%, #172e32 100%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn 0.2s ease-out both',
        'scale-in':   'scaleIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
        'float':      'float 3.5s ease-in-out infinite',
        'live':       'live-pulse 1.6s ease-in-out infinite',
        'spin-slow':  'spin-slow 8s linear infinite',
        'shimmer':    'shimmer 0.7s ease-in-out',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'translate(-50%,-48%) scale(0.93)' },
          to:   { opacity: '1', transform: 'translate(-50%,-50%) scale(1)' },
        },
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'glow-pulse': {
          '0%,100%': { boxShadow: '0 0 10px 2px hsl(185 73% 26% / 0.22)' },
          '50%':     { boxShadow: '0 0 22px 6px hsl(185 73% 26% / 0.42)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-7px)' },
        },
        'live-pulse': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.35' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;
