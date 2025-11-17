/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './js/**/*.js',
    './phoenix/**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        // Paleta BitForward Phoenix
        'bf-primary': '#1E40AF',      // Azul profundo BitForward
        'bf-secondary': '#F59E0B',    // Oro/Amarillo vibrante
        'bf-accent': '#10B981',       // Verde esmeralda
        'bf-dark': '#0F172A',         // Azul marino oscuro
        'bf-light': '#F8FAFC',        // Blanco suave
        'bf-gray': '#64748B',         // Gris neutro

        // Colores de criptomonedas
        'crypto-btc': '#F7931A',      // Bitcoin naranja
        'crypto-eth': '#627EEA',      // Ethereum azul
        'crypto-sol': '#14F195',      // Solana gradiente verde
        'crypto-usdt': '#26A17B',     // Tether verde
        'crypto-usdc': '#2775CA',     // USD Coin azul
        'crypto-dai': '#F5AC37',      // DAI dorado

        // Estados y alertas
        'success': '#059669',         // Verde éxito
        'warning': '#D97706',         // Naranja advertencia
        'error': '#DC2626',           // Rojo error
        'info': '#2563EB',            // Azul información
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        'display': ['Satoshi', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'bf-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'bf-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'bf-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'bf-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'bf-glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'crypto-glow': '0 0 30px rgba(247, 147, 26, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'bf-hero': 'linear-gradient(135deg, #1E40AF 0%, #0F172A 100%)',
        'crypto-gradient': 'linear-gradient(135deg, #F7931A 0%, #627EEA 50%, #14F195 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
