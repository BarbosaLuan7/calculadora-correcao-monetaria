/**
 * Design Tokens - Luan Barbosa Advocacia Especializada
 * Baseado no Branding Book 2024
 *
 * Single source of truth para cores, tipografia e espaçamentos
 */

// =============================================================================
// CORES DA MARCA
// =============================================================================

export const colors = {
  // Cores principais (do Branding Book)
  brand: {
    primary: '#2f3a44',      // Pantone 432 C - Azul escuro principal
    secondary: '#424e5b',     // Pantone 7545 C - Azul médio
    navy: '#1c3f53',          // Pantone 302 C - Azul profundo
    slate: '#325c71',         // Pantone 7699 C - Azul slate
    gold: '#93784a',          // Pantone 872 C - Dourado/Bronze (accent)
    black: '#000000',         // Preto puro
  },

  // Cores semânticas
  semantic: {
    success: '#16a34a',       // Verde para sucesso
    warning: '#ca8a04',       // Amarelo para avisos
    error: '#dc2626',         // Vermelho para erros
    info: '#325c71',          // Azul para informações
  },

  // Escala de cinza
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Cores de fundo
  background: {
    light: '#ffffff',
    muted: '#f9fafb',
    dark: '#2f3a44',
  },

  // Cores de texto
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    muted: '#6b7280',
    inverse: '#ffffff',
    gold: '#93784a',
  },
} as const

// =============================================================================
// TIPOGRAFIA - Estética Zen/Moderna
// =============================================================================

export const typography = {
  // Família de fontes - Moderna e premium
  fontFamily: {
    heading: '"Plus Jakarta Sans", "Inter", sans-serif',
    body: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  // Tamanhos de fonte (rem)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },

  // Pesos de fonte
  fontWeight: {
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Altura de linha
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Espaçamento entre letras
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// =============================================================================
// ESPAÇAMENTOS
// =============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const

// =============================================================================
// SOMBRAS
// =============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  // Sombra com cor da marca
  gold: '0 4px 14px 0 rgb(147 120 74 / 0.3)',
  primary: '0 4px 14px 0 rgb(47 58 68 / 0.3)',
} as const

// =============================================================================
// TRANSIÇÕES
// =============================================================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// =============================================================================
// EXPORT COMPLETO
// =============================================================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
} as const

export default designTokens
