import React from 'react'

interface Props {
  size?: number
  className?: string
  /** 'full' = icon + wordmark, 'icon' = just the circle W, 'text' = just wordmark */
  variant?: 'full' | 'icon' | 'text'
  dark?: boolean
}

// ── Inline SVG icon (circle with W + ribbon) ──────────────────────────────────
export function VyawanIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer circle */}
      <circle cx="50" cy="50" r="44" stroke="#3E2723" strokeWidth="5" fill="none" />
      {/* W shape */}
      <path d="M22 32 L34 68 L50 44 L66 68 L78 32" stroke="#3E2723" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Ribbon / loop on the W center */}
      <path d="M50 44 C50 44 44 52 44 58 C44 64 50 68 50 68 C50 68 56 64 56 58 C56 52 50 44 50 44Z" fill="#9B8EC4" />
    </svg>
  )
}

// ── Wordmark text ─────────────────────────────────────────────────────────────
export function VyawanWordmark({ size = 28, className = '' }: { size?: number; className?: string }) {
  const h = size
  return (
    <svg width={h * 3.8} height={h} viewBox="0 0 190 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* vya */}
      <text x="0" y="40" fontFamily="Georgia, 'Times New Roman', serif" fontSize="44" fontWeight="400" fill="#3E2723">vya</text>
      {/* w — purple */}
      <text x="88" y="40" fontFamily="Georgia, 'Times New Roman', serif" fontSize="44" fontWeight="400" fill="#9B8EC4">w</text>
      {/* an */}
      <text x="122" y="40" fontFamily="Georgia, 'Times New Roman', serif" fontSize="44" fontWeight="400" fill="#3E2723">an</text>
    </svg>
  )
}

// ── Full logo (icon + wordmark) ───────────────────────────────────────────────
export default function VyawanLogo({ size = 32, className = '', variant = 'full' }: Props) {
  if (variant === 'icon') return <VyawanIcon size={size} className={className} />
  if (variant === 'text') return <VyawanWordmark size={size} className={className} />
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <VyawanIcon size={size} />
      <VyawanWordmark size={size * 0.85} />
    </div>
  )
}
