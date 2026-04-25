import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import ManufacturerRegisterModal from '@/features/manufacturer/RegisterModal'
import BuyerRegisterModal from '@/features/buyer/BuyerRegisterModal'
import VyawanLogo from '@/components/VyawanLogo'
import { api } from '@/lib/api'

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
    <svg viewBox="0 0 180 340" width="150" height="280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="75" cy="335" rx="55" ry="8" fill="#D4C4B0" opacity="0.5" />
      {/* Head */}
      <circle cx="75" cy="52" r="30" fill="#D4A882" />
      {/* Hair */}
      <path d="M46 42 Q48 18 75 18 Q102 18 104 42 Q95 28 75 28 Q55 28 46 42Z" fill="#2C1810" />
      {/* Neck */}
      <rect x="68" y="78" width="14" height="14" rx="4" fill="#C49870" />
      {/* Body — tan shirt */}
      <path d="M45 92 Q55 86 75 86 Q95 86 105 92 L110 170 L40 170Z" fill="#C4A882" />
      {/* Left arm */}
      <path d="M45 95 Q30 110 28 140 Q28 148 34 148 Q40 148 42 140 L48 110Z" fill="#C4A882" />
      {/* Right arm — down by side */}
      <path d="M105 95 Q118 108 120 135 Q120 143 114 143 Q108 143 107 135 L103 108Z" fill="#C4A882" />
      {/* Pants — dark brown */}
      <path d="M40 168 L55 168 L60 270 L50 270 L45 220 L40 270 L30 270 L35 168Z" fill="#4A3020" />
      <path d="M110 168 L95 168 L90 270 L100 270 L105 220 L110 270 L120 270 L115 168Z" fill="#4A3020" />
      {/* Shoes */}
      <ellipse cx="45" cy="272" rx="18" ry="9" fill="#2C1810" />
      <ellipse cx="105" cy="272" rx="18" ry="9" fill="#2C1810" />
    </svg>
  )
}

// ── SVG Illustration — manufacturer (person pushing cart with boxes) ──────────
function ManufacturerIllustration() {
  return (
    <svg viewBox="0 0 320 300" width="300" height="260" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="200" cy="292" rx="100" ry="10" fill="#D4C4B0" opacity="0.5" />

      {/* ── Background box stack (lighter) ── */}
      {[0,1,2].map(row => [0,1,2].map(col => (
        <rect key={`bg-${row}-${col}`}
          x={20 + col * 52} y={100 + row * 52} width={48} height={48} rx="4"
          fill={row === 0 ? '#E8D5B8' : '#DCC8A8'} stroke="#C4A882" strokeWidth="1" />
      )))}
      {/* Handle lines on bg boxes */}
      {[0,1,2].map(row => [0,1,2].map(col => (
        <rect key={`bgh-${row}-${col}`}
          x={32 + col * 52} y={118 + row * 52} width={24} height={5} rx="2.5"
          fill="#C4A882" opacity="0.6" />
      )))}

      {/* ── Cart platform ── */}
      <rect x="110" y="240" width="130" height="14" rx="5" fill="#8B7355" />
      {/* Cart wheels */}
      <circle cx="130" cy="268" r="14" fill="#6B4E3D" />
      <circle cx="130" cy="268" r="7" fill="#4A3020" />
      <circle cx="220" cy="268" r="14" fill="#6B4E3D" />
      <circle cx="220" cy="268" r="7" fill="#4A3020" />
      {/* Cart handle bar */}
      <rect x="234" y="130" width="10" height="114" rx="5" fill="#4A3020" />
      <rect x="230" y="126" width="18" height="10" rx="5" fill="#4A3020" />

      {/* ── Boxes on cart (darker brown) ── */}
      {[0,1,2].map(row => [0,1].map(col => (
        <rect key={`box-${row}-${col}`}
          x={118 + col * 56} y={108 + row * 44} width={52} height={40} rx="4"
          fill={row === 0 ? '#C4956A' : '#B8845A'} stroke="#A07040" strokeWidth="1.5" />
      )))}
      {/* Top single box */}
      <rect x="146" y="68" width="52" height="40" rx="4" fill="#D4A574" stroke="#C4956A" strokeWidth="1.5" />
      {/* Handle lines on cart boxes */}
      {[0,1,2].map(row => [0,1].map(col => (
        <rect key={`bxh-${row}-${col}`}
          x={130 + col * 56} y={124 + row * 44} width={28} height={5} rx="2.5"
          fill="#8B6040" opacity="0.7" />
      )))}
      <rect x="158" y="84" width="28" height="5" rx="2.5" fill="#A07040" opacity="0.7" />

      {/* ── Person ── */}
      {/* Shadow under feet */}
      <ellipse cx="278" cy="288" rx="28" ry="7" fill="#D4C4B0" opacity="0.6" />
      {/* Head */}
      <circle cx="278" cy="80" r="26" fill="#D4A882" />
      {/* Hair */}
      <path d="M254 72 Q256 52 278 52 Q300 52 302 72 Q294 60 278 60 Q262 60 254 72Z" fill="#2C1810" />
      {/* Neck */}
      <rect x="271" y="103" width="14" height="12" rx="4" fill="#C49870" />
      {/* Body — khaki uniform */}
      <path d="M252 115 Q262 108 278 108 Q294 108 304 115 L308 195 L248 195Z" fill="#C4A882" />
      {/* Left arm — reaching forward to handle */}
      <path d="M304 118 Q318 130 232 132 Q228 132 228 128 Q228 124 232 124 L308 122Z" fill="#C4A882" />
      {/* Right arm — back */}
      <path d="M252 118 Q238 130 236 155 Q236 162 242 162 Q248 162 249 155 L254 130Z" fill="#C4A882" />
      {/* Legs — walking pose */}
      <path d="M248 193 L260 193 L256 288 L244 288 Z" fill="#8B7355" />
      <path d="M296 193 L308 193 L318 270 L306 270 Z" fill="#8B7355" />
      {/* Shoes */}
      <ellipse cx="250" cy="290" rx="16" ry="8" fill="#2C1810" />
      <ellipse cx="312" cy="272" rx="16" ry="8" fill="#2C1810" />
    </svg>
  )
}

// ── Floating product icons ────────────────────────────────────────────────────
function FloatingIcons() {
  const C = '#8B7355' // muted brown for lines/text
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* $ sign 1 — left */}
      <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}
        style={{ position: 'absolute', top: '28%', left: '22%', fontSize: 18, fontWeight: 800, color: C, opacity: 0.85, fontFamily: 'Inter, sans-serif' }}>$</motion.span>
      {/* $ sign 2 — top center */}
      <motion.span animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 3.4, delay: 0.4 }}
        style={{ position: 'absolute', top: '12%', left: '44%', fontSize: 16, fontWeight: 800, color: C, opacity: 0.8, fontFamily: 'Inter, sans-serif' }}>$</motion.span>
      {/* $ sign 3 — right */}
      <motion.span animate={{ y: [0, -9, 0] }} transition={{ repeat: Infinity, duration: 2.9, delay: 0.9 }}
        style={{ position: 'absolute', top: '22%', left: '58%', fontSize: 16, fontWeight: 800, color: C, opacity: 0.75, fontFamily: 'Inter, sans-serif' }}>$</motion.span>

      {/* Trending line 1 — left of bottle */}
      <motion.svg animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3.2 }}
        style={{ position: 'absolute', top: '20%', left: '28%' }} width="65" height="28" viewBox="0 0 65 28">
        <polyline points="0,24 10,20 20,21 32,14 44,15 55,8 65,5" fill="none" stroke={C} strokeWidth="1.5" strokeLinecap="round" />
        {[0,10,20,32,44,55,65].map((x,i) => {
          const ys = [24,20,21,14,15,8,5]
          return <circle key={i} cx={x} cy={ys[i]} r="2.5" fill={C} />
        })}
      </motion.svg>

      {/* Trending line 2 — right of orange */}
      <motion.svg animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 2.8, delay: 0.6 }}
        style={{ position: 'absolute', top: '30%', left: '52%' }} width="65" height="28" viewBox="0 0 65 28">
        <polyline points="0,24 10,20 20,21 32,14 44,15 55,8 65,5" fill="none" stroke={C} strokeWidth="1.5" strokeLinecap="round" />
        {[0,10,20,32,44,55,65].map((x,i) => {
          const ys = [24,20,21,14,15,8,5]
          return <circle key={i} cx={x} cy={ys[i]} r="2.5" fill={C} />
        })}
      </motion.svg>

      {/* Egg — tan/beige */}
      <motion.svg animate={{ y: [0, -9, 0] }} transition={{ repeat: Infinity, duration: 3.6, delay: 0.2 }}
        style={{ position: 'absolute', top: '24%', left: '20%' }} width="32" height="40" viewBox="0 0 32 40">
        <ellipse cx="16" cy="22" rx="13" ry="17" fill="#D4B896" />
        <ellipse cx="16" cy="20" rx="10" ry="13" fill="#E8CCA8" opacity="0.5" />
      </motion.svg>

      {/* Bottle — dark brown */}
      <motion.svg animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 4 }}
        style={{ position: 'absolute', top: '8%', left: '42%' }} width="24" height="52" viewBox="0 0 24 52">
        <rect x="8" y="0" width="8" height="10" rx="3" fill="#6B4E3D" />
        <rect x="6" y="8" width="12" height="4" rx="2" fill="#4A3020" />
        <path d="M3 12 Q1 18 1 26 L1 44 Q1 50 12 50 Q23 50 23 44 L23 26 Q23 18 21 12Z" fill="#8B6347" />
        <rect x="5" y="22" width="14" height="3" rx="1.5" fill="#6B4E3D" opacity="0.6" />
        <rect x="5" y="30" width="14" height="3" rx="1.5" fill="#6B4E3D" opacity="0.4" />
      </motion.svg>

      {/* Orange */}
      <motion.svg animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.3, delay: 0.7 }}
        style={{ position: 'absolute', top: '28%', left: '50%' }} width="38" height="42" viewBox="0 0 38 42">
        <circle cx="19" cy="23" r="16" fill="#D4874A" />
        <ellipse cx="19" cy="22" rx="14" ry="14" fill="#E8A060" />
        <path d="M19 7 Q22 11 19 14 Q16 11 19 7Z" fill="#5D8A3C" />
        <path d="M19 7 Q20 5 22 6" fill="none" stroke="#5D8A3C" strokeWidth="1.5" strokeLinecap="round" />
      </motion.svg>

      {/* Dot connector */}
      <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
        style={{ position: 'absolute', top: '38%', left: '28%', width: 9, height: 9, borderRadius: '50%', background: C, opacity: 0.7 }} />
      {/* L-shaped connector line */}
      <svg style={{ position: 'absolute', top: '38%', left: '28%' }} width="80" height="60" viewBox="0 0 80 60">
        <path d="M4 4 L4 40 L76 40" fill="none" stroke={C} strokeWidth="1.5" opacity="0.5" />
      </svg>

      {/* Shopping cart outline */}
      <motion.svg animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: 0.3 }}
        style={{ position: 'absolute', top: '32%', left: '32%' }} width="120" height="90" viewBox="0 0 120 90">
        {/* Cart body trapezoid */}
        <path d="M15 8 L105 8 L95 62 L25 62Z" fill="none" stroke={C} strokeWidth="2.5" strokeLinejoin="round" />
        {/* Grid lines vertical */}
        <line x1="42" y1="8" x2="38" y2="62" stroke={C} strokeWidth="1.5" opacity="0.6" />
        <line x1="60" y1="8" x2="60" y2="62" stroke={C} strokeWidth="1.5" opacity="0.6" />
        <line x1="78" y1="8" x2="82" y2="62" stroke={C} strokeWidth="1.5" opacity="0.6" />
        {/* Grid lines horizontal */}
        <line x1="20" y1="28" x2="100" y2="28" stroke={C} strokeWidth="1.5" opacity="0.6" />
        <line x1="22" y1="46" x2="98" y2="46" stroke={C} strokeWidth="1.5" opacity="0.6" />
        {/* Cart stem */}
        <path d="M60 62 L60 72 L30 72" fill="none" stroke={C} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M5 0 L15 8" stroke={C} strokeWidth="2.5" strokeLinecap="round" />
        {/* Wheels */}
        <circle cx="38" cy="80" r="8" fill="none" stroke={C} strokeWidth="2.5" />
        <circle cx="82" cy="80" r="8" fill="none" stroke={C} strokeWidth="2.5" />
      </motion.svg>
    </div>
  )
}

// ── Shared page shell (defined OUTSIDE LoginPage to prevent remount on state change) ──
function Shell({ children, onLogoClick }: { children: React.ReactNode; onLogoClick: () => void }) {
  return (
    <div style={{ height: '100vh', background: BG, display: 'flex', alignItems: 'center', fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'relative' }}>
      <div onClick={onLogoClick} style={{ position: 'absolute', top: '1.5rem', left: '2rem', cursor: 'pointer', zIndex: 10 }}>
        <VyawanLogo size={44} />
      </div>
      <FloatingIcons />
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '2%' }}><BuyerIllustration /></div>
        <div style={{ position: 'absolute', bottom: 0, left: '30%' }}><ManufacturerIllustration /></div>
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
      let targetCompanyId = ''
      if (role === 'buyer') {
        if (!storeCode.trim()) throw new Error('Store Access Code is required for buyers.')
        const company = await api.getCompanyByCode(storeCode.toUpperCase())
        targetCompanyId = company.user._id
        localStorage.setItem('directStoreAccess', targetCompanyId)
      }

      const user = await login(email, password)
      if (user.role !== role) { setError(`This account is a ${user.role}, not ${role}.`); return }
      
      if (role === 'buyer') {
        navigate(`/company/${targetCompanyId}`)
      } else {
        navigate('/manufacturer/overview')
      }
    } catch (err: any) { 
      setError(err.message === 'Company not found' ? 'Invalid Store Code. Please check MNG ID.' : err.message ?? 'Login failed.') 
    }
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

  const [storeCode, setStoreCode] = useState('')

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google Sign-in failed.'),
  })

  const handleStoreAccess = async (e: React.FormEvent) => {
    e.preventDefault(); if (!storeCode.trim()) return;
    setError(''); setLoading(true);
    try {
      const company = await api.getCompanyByCode(storeCode.toUpperCase());
      navigate(`/companies/${company.user._id}`);
    } catch (err: any) {
      setError(err.message === 'Company not found' ? 'Invalid Store ID. Please check the code.' : 'Failed to find store.');
    } finally { setLoading(false) }
  }

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
    <>
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '11px' }}>
                  <input type="text" placeholder="Enter Company Name" value={buyerCompany} onChange={e => setBuyerCompany(e.target.value)}
                    style={inp()}
                    onFocus={e => (e.currentTarget.style.borderColor = MID)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />

                  {/* Direct Store Access (Buyer Only) */}
                  <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: `1px dashed ${BORDER}` }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: MID, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Store Access Code *
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="e.g. MFR-AB12CD" 
                        value={storeCode}
                        onChange={e => setStoreCode(e.target.value.toUpperCase())}
                        required
                        style={{ ...inp(), flex: 1, textTransform: 'uppercase', fontWeight: 600, fontSize: '13px' }} 
                      />
                    </div>
                  </div>
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

      <AnimatePresence>
        {showRegisterModal && (
          <ManufacturerRegisterModal 
            open={showRegisterModal} 
            onClose={() => setShowRegisterModal(false)} 
            onSuccess={() => { setShowRegisterModal(false); setError('Account created successfully! Please login.') }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBuyerRegisterModal && (
          <BuyerRegisterModal 
            open={showBuyerRegisterModal} 
            onClose={() => setShowBuyerRegisterModal(false)} 
            onSuccess={() => { setShowBuyerRegisterModal(false); setError('Account created successfully! Please login.') }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
