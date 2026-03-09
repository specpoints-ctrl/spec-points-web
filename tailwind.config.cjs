/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SpecPoints Identidade Visual - Verde Petróleo + Dourado/Areia
        background: '#0f1a1a',
        foreground: '#e6dcc6',
        primary: '#c4b5a0',
        secondary: '#1a3a3a',
        muted: '#1f3434',
        accent: '#d4a574',
        
        // Semânticas
        success: '#2d8659',
        warning: '#f4a824',
        destructive: '#cd4c3f',
        
        // Rankings
        bronze: '#8b6f47',
        gold: '#d4a574',
        silver: '#a3a3a3',
        
        // Componentes
        card: '#1a3a3a',
        'card-foreground': '#e6dcc6',
        border: '#2a4a4a',
        input: '#0f1a1a',
        ring: '#c4b5a0',
        
        // Sidebar
        'sidebar-background': '#0d2727',
        'sidebar-foreground': '#e6dcc6',
        'sidebar-accent': '#c4b5a0',
      },
      borderRadius: {
        xs: '0.375rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};

module.exports = config;