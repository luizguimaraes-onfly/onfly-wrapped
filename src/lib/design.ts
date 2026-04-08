// Centralized design tokens for Onfly Wrapped
// All color, gradient, shadow, and orb definitions live here.

export const colors = {
  primary: '#2872fa',
  secondary: '#009EFB',
  accent: '#7c3aed',
  dark: '#0d1b2e',
  bgLight: '#f4f7ff',
  bgBase: '#eef3ff',
} as const

export const gradients = {
  primary:    'linear-gradient(135deg, #2872fa, #009EFB)',
  slide:      'linear-gradient(135deg, #009EFB 0%, #2872FA 100%)',
  background: 'linear-gradient(160deg, #f4f7ff 0%, #eef3ff 100%)',
  card:       'rgba(255,255,255,0.85)',
  cardBorder: 'rgba(40,114,250,0.15)',
  cardShadow: '0 20px 60px rgba(40,114,250,0.12)',
} as const

// Text tokens for use ON the slide gradient (dark bg variant)
export const slideText = {
  primary:  'text-white',
  secondary: 'text-white/70',
  muted:    'text-white/50',
  label:    'text-white/60',
} as const

export const ORBS = [
  { color: '#2872fa', size: 400, x: '-15%', y: '-20%', delay: 0 },
  { color: '#009EFB', size: 300, x: '65%',  y: '55%',  delay: 0.5 },
  { color: '#7c3aed', size: 250, x: '75%',  y: '-15%', delay: 1 },
] as const

// Slide-specific orbs (smaller, tighter for within-card use)
export const SLIDE_ORBS = [
  { color: '#2872fa', size: 260, x: '-10%', y: '-15%', delay: 0 },
  { color: '#009EFB', size: 200, x: '60%',  y: '55%',  delay: 0.4 },
  { color: '#7c3aed', size: 160, x: '70%',  y: '-20%', delay: 0.8 },
] as const

// Opacity hierarchy for text on light backgrounds
// Title:       text-[#0d1b2e]       (100%)
// Subtitle:    text-[#0d1b2e]/60
// Label:       text-[#0d1b2e]/45
// Muted:       text-[#0d1b2e]/30

// Shared inline style helpers (for values Tailwind cannot express)
export const cardStyle = {
  background: gradients.card,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${gradients.cardBorder}`,
  boxShadow: gradients.cardShadow,
} as const

export const primaryButtonStyle = {
  background: gradients.primary,
  boxShadow: '0 4px 16px rgba(40,114,250,0.3)',
} as const

export const inputBorder = '1.5px solid rgba(40,114,250,0.2)' as const
export const inputBorderFocus = colors.primary

export const slideContainerShadow =
  '0 0 0 1px rgba(40,114,250,0.12), 0 20px 60px rgba(40,114,250,0.18)' as const
