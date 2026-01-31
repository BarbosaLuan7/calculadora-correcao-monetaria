/**
 * ============================================================================
 * LUAN BARBOSA DESIGN SYSTEM - TAILWIND CONFIG STARTER
 * ============================================================================
 *
 * Copie este arquivo como tailwind.config.js em novos projetos
 *
 * ============================================================================
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // =======================================================================
      // CORES DA MARCA - Luan Barbosa Advocacia (Branding Book 2024)
      // =======================================================================
      colors: {
        // Cores da marca
        lb: {
          primary: '#2f3a44',    // Pantone 432 C - Header, textos principais
          secondary: '#424e5b',  // Pantone 7545 C - Labels
          navy: '#1c3f53',       // Pantone 302 C - Alternativa escura
          slate: '#325c71',      // Pantone 7699 C - Links
          gold: '#93784a',       // Pantone 872 C - CTAs, destaques
          'gold-light': '#a8896a', // Hover
          'gold-dark': '#7d654a',  // Active
        },

        // Variáveis shadcn/ui (opcional)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },

      // =======================================================================
      // TIPOGRAFIA
      // =======================================================================
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },

      // =======================================================================
      // BORDER RADIUS
      // =======================================================================
      borderRadius: {
        lg: '0.75rem',   // 12px
        md: '0.5rem',    // 8px
        sm: '0.375rem',  // 6px
        xl: '1rem',      // 16px
        '2xl': '1.25rem', // 20px
      },

      // =======================================================================
      // SOMBRAS
      // =======================================================================
      boxShadow: {
        'gold': '0 4px 14px 0 rgb(147 120 74 / 0.25)',
        'gold-hover': '0 6px 20px 0 rgb(147 120 74 / 0.35)',
        'primary': '0 4px 14px 0 rgb(47 58 68 / 0.3)',
        'soft': '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
      },

      // =======================================================================
      // ANIMAÇÕES
      // =======================================================================
      keyframes: {
        'reveal': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'reveal': 'reveal 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'fade-in': 'fade-in 0.3s ease-out',
      },

      // =======================================================================
      // TRANSIÇÕES
      // =======================================================================
      transitionDuration: {
        '200': '200ms',  // inputs, estados
        '300': '300ms',  // cards, botões (padrão)
        '500': '500ms',  // modais, páginas
      },
    },
  },
  plugins: [],
}
