import React from 'react'

interface Props {
  size?: number
  className?: string
  variant?: 'full' | 'icon' | 'text'
}

// Logo image placed at b2b-/frontend/public/vyawan (3).png
const LOGO_SRC = '/vyawan (3).png'

// ── Default export — full logo image ─────────────────────────────────────────
// size = height in px. Width auto-scales (image is ~3:1 wide).
export default function VyawanLogo({ size = 44, className = '', variant = 'full' }: Props) {
  if (variant === 'icon') return <VyawanIcon size={size} className={className} />
  if (variant === 'text') return <VyawanIcon size={size} className={className} />
  return (
    <img
      src={LOGO_SRC}
      alt="Vyawan"
      style={{ height: size, width: 'auto', display: 'block', objectFit: 'contain' }}
      className={className}
    />
  )
}

// ── Icon variant — same image, used in sidebars ───────────────────────────────
export function VyawanIcon({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Vyawan"
      style={{
        height: 56,
        width: '100%',
        display: 'block',
        objectFit: 'cover',
        objectPosition: 'center',
      }}
      className={className}
    />
  )
}

// ── Wordmark variant ──────────────────────────────────────────────────────────
export function VyawanWordmark({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Vyawan"
      style={{ height: size, width: 'auto', display: 'block', objectFit: 'contain' }}
      className={className}
    />
  )
}
