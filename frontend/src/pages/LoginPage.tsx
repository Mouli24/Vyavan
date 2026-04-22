import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import ManufacturerRegisterModal from '@/features/manufacturer/RegisterModal'
import BuyerRegisterModal from '@/features/buyer/BuyerRegisterModal'
import VyawanLogo from '@/components/VyawanLogo'

type Role = 'buyer' | 'manufacturer'

const BG    = '#EDE8DF'
const CARD  = '#FFFFFF'
const BROWN = '#2C1810'
const MID   = '#5D4037'
const PEACH = '#FCE7D6'
const BORDER = '#E5E1DA'
const MUTED  = '#8B7355'
const INPUT  = '#F5F2ED'

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', padding: '13px 16px', borderRadius: '12px',
  border: `1.5px solid ${BORDER}`, background: INPUT,
  fontSize: '14px', color: BROWN, fontFamily: 'Inter, sans-serif',
  outline: 'none', boxSizing: 'border-box', ...extra,
})

// ── SVG Illustration — buyer (person standing, looking at cart) ───────────────
function BuyerIllustration() {
  return (
    <svg viewBox="0 0 160 320" width="130" height="260" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="80" cy="48" r="28" fill="#C4956A" />
      {/* Hair */}
      <ellipse cx="80" cy="28" rx="28" ry="16" fill="#2C1810" />
      {/* Body */}
      <rect x="52" y="76" width="56" height="80" rx="12" fill="#8B6347" />
      {/* Left arm */}
      <rect x="28" y="80" width="26" height="14" rx="7" fill="#8B6347" />
      {/* Right arm */}
      <rect x="106" y="80" width="26" height="14" rx="7" fill="#8B6347" />
      {/* Pants */}
      <rect x="52" y="152" width="24" height="80" rx="8" fill="#2C1810" />
      <rect x="84" y="152" width="24" height="80" rx="8" fill="#2C1810" />
      {/* Shoes */}
      <ellipse cx="64" cy="234" rx="16" ry="8" fill="#1A0F0A" />
      <ellipse cx="96" cy="234" rx="16" ry="8" fill="#1A0F0A" />
    </svg>
  )
}

// ── SVG Illustration — manufacturer (person pushing cart with boxes) ──────────
function ManufacturerIllustration() {
  return (
    <svg viewBox="0 0 220 320" width="200" height="260" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Person head */}
      <circle cx="60" cy="52" r="26" fill="#C4956A" />
      <ellipse cx="60" cy="34" rx="26" ry="14" fill="#2C1810" />
      {/* Body / uniform */}
      <rect x="36" y="78" width="52" height="76" rx="10" fill="#A0845C" />
      {/* Arms */}
      <rect x="14" y="82" width="24" height="12" rx="6" fill="#A0845C" />
      <rect x="88" y="82" width="50" height="12" rx="6" fill="#A0845C" />
      {/* Legs */}
      <rect x="38" y="150" width="22" height="76" rx="8" fill="#6B4E3D" />
      <rect x="66" y="150" width="22" height="76" rx="8" fill="#6B4E3D" />
      {/* Shoes */}
      <ellipse cx="49" cy="228" rx="15" ry="7" fill="#1A0F0A" />
      <ellipse cx="77" cy="228" rx="15" ry="7" fill="#1A0F0A" />
      {/* Cart handle */}
      <rect x="136" y="82" width="8" height="120" rx="4" fill="#8B7355" />
      {/* Cart base */}
      <rect x="130" y="196" width="70" height="10" rx="5" fill="#8B7355" />
      {/* Cart wheels */}
      <circle cx="148" cy="214" r="10" fill="#6B4E3D" stroke="#2C1810" strokeWidth="3" />
      <circle cx="182" cy="214" r="10" fill="#6B4E3D" stroke="#2C1810" strokeWidth="3" />
      {/* Boxes stack */}
      <rect x="138" y="120" width="56" height="36" rx="4" fill="#D4A574" stroke="#C4956A" strokeWidth="1.5" />
      <rect x="138" y="156" width="56" height="36" rx="4" fill="#C4956A" stroke="#B8845A" strokeWidth="1.5" />
      <rect x="144" y="88" width="44" height="36" rx="4" fill="#E8C49A" stroke="#D4A574" strokeWidth="1.5" />
      {/* Box lines */}
      <line x1="166" y1="120" x2="166" y2="156" stroke="#B8845A" strokeWidth="1.5" />
      <line x1="166" y1="156" x2="166" y2="192" stroke="#A07040" strokeWidth="1.5" />
      <line x1="166" y1="88" x2="166" y2="124" stroke="#C4956A" strokeWidth="1.5" />
      {/* Background boxes */}
      <rect x="148" y="60" width="36" height="30" rx="3" fill="#E8D5B8" opacity="0.6" />
      <rect x="158" y="40" width="36" height="30" rx="3" fill="#E8D5B8" opacity="0.4" />
      <rect x="168" y="20" width="36" height="30" rx="3" fill="#E8D5B8" opacity="0.25" />
    </svg>
  )
}

// ── Floating product icons ────────────────────────────────────────────────────
function FloatingIcons() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* $ signs */}
      {[
        { top: '14%', left: '18%', size: 20, delay: 0 },
        { top: '10%', left: '42%', size: 17, delay: 0.5 },
        { top: '20%', left: '55%', size: 16, delay: 1 },
      ].map((s, i) => (
        <motion.span key={i} animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 + i * 0.4, delay: s.delay }}
          style={{ position: 'absolute', top: s.top, left: s.left, fontSize: s.size, fontWeight: 800, color: MUTED, opacity: 0.75 }}>$</motion.span>
      ))}

      {/* Trending line 1 */}
      <motion.svg animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3.2 }}
        style={{ position: 'absolute', top: '8%', left: '50%' }} width="70" height="32" viewBox="0 0 70 32">
        <polyline points="0,28 18,20 35,22 52,10 70,6" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" />
        <circle cx="70" cy="6" r="3.5" fill={MUTED} />
      </motion.svg>

      {/* Trending line 2 */}
      <motion.svg animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.8, delay: 0.7 }}
        style={{ position: 'absolute', top: '18%', left: '35%' }} width="55" height="26" viewBox="0 0 55 26">
        <polyline points="0,22 14,16 28,18 42,8 55,4" fill="none" stroke="#C4A882" strokeWidth="2" strokeLinecap="round" />
        <circle cx="55" cy="4" r="3" fill="#C4A882" />
      </motion.svg>

      {/* Bottle */}
      <motion.svg animate={{ y: [0, -10, 0], rotate: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 4 }}
        style={{ position: 'absolute', top: '6%', left: '44%' }} width="22" height="44" viewBox="0 0 22 44">
        <rect x="7" y="0" width="8" height="8" rx="2" fill={MUTED} />
        <path d="M4 8 Q2 14 2 20 L2 38 Q2 42 11 42 Q20 42 20 38 L20 20 Q20 14 18 8Z" fill="#A89F91" />
        <rect x="6" y="18" width="10" height="2" rx="1" fill={MUTED} opacity="0.5" />
      </motion.svg>

      {/* Orange */}
      <motion.svg animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, delay: 0.6 }}
        style={{ position: 'absolute', top: '22%', left: '38%' }} width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="17" r="13" fill="#D4874A" />
        <ellipse cx="16" cy="17" rx="13" ry="13" fill="#E8A060" />
        <path d="M16 4 Q18 8 16 10 Q14 8 16 4Z" fill="#5D8A3C" />
      </motion.svg>

      {/* Dot */}
      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
        style={{ position: 'absolute', top: '30%', left: '26%', width: 8, height: 8, borderRadius: '50%', background: MUTED, opacity: 0.6 }} />

      {/* Cart outline */}
      <motion.svg animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: 0.3 }}
        style={{ position: 'absolute', top: '28%', left: '28%' }} width="100" height="80" viewBox="0 0 100 80">
        <path d="M10 10 L20 10 L35 55 L80 55 L90 25 L25 25" fill="none" stroke={MUTED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="42" cy="65" r="6" fill="none" stroke={MUTED} strokeWidth="3" />
        <circle cx="72" cy="65" r="6" fill="none" stroke={MUTED} strokeWidth="3" />
        {/* Grid lines on cart */}
        <line x1="45" y1="25" x2="40" y2="55" stroke={MUTED} strokeWidth="1.5" opacity="0.5" />
        <line x1="60" y1="25" x2="57" y2="55" stroke={MUTED} strokeWidth="1.5" opacity="0.5" />
        <line x1="75" y1="25" x2="74" y2="55" stroke={MUTED} strokeWidth="1.5" opacity="0.5" />
        <line x1="28" y1="35" x2="82" y2="35" stroke={MUTED} strokeWidth="1.5" opacity="0.5" />
        <line x1="31" y1="45" x2="81" y2="45" stroke={MUTED} strokeWidth="1.5" opacity="0.5" />
      </motion.svg>
    </div>
  )
}

// ── Shared page shell (defined OUTSIDE LoginPage to prevent remount on state change) ──
function Shell({ children, onLogoClick }: { children: React.ReactNode; onLogoClick: () => void }) {
  return (
    <div style={{ height: '100vh', background: BG, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'relative' }}>
      <div onClick={onLogoClick} style={{ position: 'absolute', top: '1.5rem', left: '2rem', cursor: 'pointer', zIndex: 10 }}>
        <VyawanLogo size={26} />
      </div>
      <FloatingIcons />
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '4%' }}><BuyerIllustration /></div>
        <div style={{ position: 'absolute', bottom: 0, left: '36%' }}><ManufacturerIllustration /></div>
      </div>
      <div style={{ width: '420px', flexShrink: 0, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 5 }}>
        {children}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, googleLogin } = useAuth()

  const [role, setRole] = useState<Role>('buyer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [buyerCompany, setBuyerCompany] = useState(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('company') || '' : ''
  )
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showBuyerRegisterModal, setShowBuyerRegisterModal] = useState(false)

  const [showAdmin, setShowAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)

  useEffect(() => {
    const handleHash = () => { if (window.location.hash === '#admin#mybusiness') setShowAdmin(true) }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    const company = searchParams.get('company')
    if (company) { setRole('buyer'); setBuyerCompany(company) }
    return () => window.removeEventListener('hashchange', handleHash)
  }, [searchParams])

  useEffect(() => { setEmail(''); setPassword(''); setError('') }, [role])

  const handleLogoClick = () => {
    const now = Date.now()
    const count = now - lastClickTime < 1000 ? clickCount + 1 : 1
    setClickCount(count); setLastClickTime(now)
    if (count === 7) { setShowAdmin(true); setClickCount(0) }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role !== role) { setError(`This account is a ${user.role}, not ${role}.`); return }
      navigate(role === 'buyer' ? '/buyer/dashboard' : '/manufacturer/overview')
    } catch (err: any) { setError(err.message ?? 'Login failed.') }
    finally { setLoading(false) }
  }

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setError(''); setLoading(true)
    try {
      const user = await googleLogin(tokenResponse.access_token, role)
      if (user.role !== role) { setError(`Google account is a ${user.role}, not ${role}.`); return }
      navigate(role === 'buyer' ? '/buyer/dashboard' : '/manufacturer/overview')
    } catch (err: any) { setError(err.message ?? 'Google Sign-in failed.') }
    finally { setLoading(false) }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Sign-in failed.'),
  })

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const user = await login(adminEmail, adminPassword)
      if (user.role !== 'admin') { setError('Not an admin account.'); return }
      navigate('/admin/dashboard')
    } catch (err: any) { setError(err.message ?? 'Login failed.') }
    finally { setLoading(false) }
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  if (showAdmin) {
    return (
      <Shell onLogoClick={handleLogoClick}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
          style={{ background: CARD, borderRadius: '24px', padding: '2.25rem', width: '100%', boxShadow: '0 8px 40px rgba(44,24,16,0.12)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {/* Admin thumbnail */}
            <div style={{ width: 80, height: 64, borderRadius: '14px', background: PEACH, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src="https://customer-assets.emergentagent.com/job_multi-role-auth-3/artifacts/ydgf82la_image.png"
                alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: BROWN, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Admin</h2>
            <p style={{ fontSize: '13px', color: '#C47A2B', fontWeight: 600, margin: 0 }}>Restricted Access Only</p>
          </div>
          {error && <p style={{ color: '#DC2626', fontSize: '13px', background: '#FEF2F2', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #FECACA' }}>{error}</p>}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="email" placeholder="Email Address" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required style={inp()}
              onFocus={e => (e.currentTarget.style.borderColor = MID)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            <div style={{ position: 'relative' }}>
              <input type={showAdminPassword ? 'text' : 'password'} placeholder="Password" value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)} required style={inp({ paddingRight: '44px' })}
                onFocus={e => (e.currentTarget.style.borderColor = MID)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
              <button type="button" onClick={() => setShowAdminPassword(v => !v)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}>
                {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '14px', borderRadius: '12px', background: BROWN, color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', marginTop: '4px', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: MUTED, margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>
              Contact administrator for access
            </p>
          </form>
        </motion.div>
      </Shell>
    )
  }

  // ── BUYER / MANUFACTURER ──────────────────────────────────────────────────
  const ROLE_INFO = {
    buyer:        { title: 'Buyer',        subtitle: 'Access your buyer dashboard',      btn: 'Login' },
    manufacturer: { title: 'Manufacturer', subtitle: 'Manage your business operations',  btn: 'Login' },
  }
  const ri = ROLE_INFO[role]

  return (
    <Shell onLogoClick={handleLogoClick}>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}
        style={{ background: CARD, borderRadius: '24px', padding: '2.25rem', width: '100%', boxShadow: '0 8px 40px rgba(44,24,16,0.12)', maxHeight: '94vh', overflowY: 'auto' }}>

        {/* Role toggle + subtitle — NO thumbnail image */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', background: INPUT, borderRadius: '12px', padding: '3px', gap: '2px', marginBottom: '10px' }}>
            {(['buyer', 'manufacturer'] as Role[]).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{
                  padding: '7px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '13px', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                  background: role === r ? CARD : 'transparent',
                  color: role === r ? BROWN : MUTED,
                  boxShadow: role === r ? '0 1px 6px rgba(44,24,16,0.1)' : 'none',
                }}>
                {r === 'buyer' ? 'Buyer' : 'Manufacturer'}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p key={role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              style={{ fontSize: '13px', color: MUTED, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {ri.subtitle}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Sourcing badge */}
        <AnimatePresence>
          {buyerCompany && role === 'buyer' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: MID, background: PEACH, padding: '4px 10px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                🏭 Sourcing from: {buyerCompany}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: '13px', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required style={inp()}
            onFocus={e => (e.currentTarget.style.borderColor = MID)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />

          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required style={inp({ paddingRight: '44px' })}
              onFocus={e => (e.currentTarget.style.borderColor = MID)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {role === 'buyer' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <input type="text" placeholder="Enter Company Name" value={buyerCompany} onChange={e => setBuyerCompany(e.target.value)}
                  style={inp()}
                  onFocus={e => (e.currentTarget.style.borderColor = MID)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading}
            style={{ marginTop: '4px', padding: '14px', borderRadius: '12px', background: BROWN, color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}>
            {loading ? 'Signing in...' : ri.btn}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: MUTED, margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>
            New here?{' '}
            <span onClick={() => role === 'buyer' ? setShowBuyerRegisterModal(true) : setShowRegisterModal(true)}
              style={{ color: MID, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              {role === 'buyer' ? 'Create your buyer account' : 'Create your business account'}
            </span>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0' }}>
            <div style={{ flex: 1, height: '1px', background: BORDER }} />
            <span style={{ fontSize: '12px', color: MUTED, fontFamily: 'Inter, sans-serif' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: BORDER }} />
          </div>

          <button type="button" onClick={() => handleGoogleLogin()} disabled={loading}
            style={{ padding: '12px', borderRadius: '12px', border: `1.5px solid ${BORDER}`, background: CARD, color: BROWN, fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = MID)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
            <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" alt="Google" style={{ width: '18px', height: '18px' }} />
            Continue with Google
          </button>
        </form>
      </motion.div>
    </Shell>
  )
}
