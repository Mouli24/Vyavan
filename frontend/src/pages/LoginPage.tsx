import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff, Mail, Lock, Archive, Truck, ShoppingCart, Cpu } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import ManufacturerRegisterModal from '@/features/manufacturer/RegisterModal'
import BuyerRegisterModal from '@/features/buyer/BuyerRegisterModal'
import { api } from '@/lib/api'

type Role = 'buyer' | 'manufacturer'

const BG     = '#EDEAE3'
const CARD   = '#FFFFFF'
const BROWN  = '#3E2723'
const MID    = '#5D4037'
const BORDER = '#E0DBD3'
const MUTED  = '#A89F91'
const INPUT  = '#F7F5F2'

// ── Floating background icons ─────────────────────────────────────────────────
function FloatingIcon({ icon: Icon, style }: { icon: any; style: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 3 + Math.random() * 2, ease: 'easeInOut' }}
      style={{ position: 'absolute', color: '#B8B0A4', opacity: 0.55, pointerEvents: 'none', ...style }}
    >
      <Icon size={38} strokeWidth={1.2} />
    </motion.div>
  )
}

// ── Page shell — defined OUTSIDE to prevent remount ───────────────────────────
function PageShell({ children, onLogoClick }: { children: React.ReactNode; onLogoClick: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Floating icons */}
      <FloatingIcon icon={Archive}      style={{ top: '12%',  left: '8%'  }} />
      <FloatingIcon icon={Cpu}          style={{ top: '18%',  right: '10%' }} />
      <FloatingIcon icon={Truck}        style={{ bottom: '22%', left: '6%' }} />
      <FloatingIcon icon={ShoppingCart} style={{ bottom: '14%', right: '8%' }} />

      {/* Logo — top left, large */}
      <div
        style={{ position: 'absolute', top: '1.5rem', left: '2rem', cursor: 'pointer', zIndex: 10 }}
        onClick={onLogoClick}
      >
        <img
          src="/vyawan (3).png"
          alt="Vyawan"
          style={{ height: 80, width: 'auto', display: 'block', objectFit: 'contain' }}
        />
      </div>

      {/* Card area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7rem 1rem 2rem', zIndex: 1 }}>
        {children}
      </div>

      {/* Security note */}
      <div style={{ textAlign: 'center', paddingBottom: '1.5rem', zIndex: 1 }}>
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>🔒 Secure enterprise-grade encryption.</p>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>© 2024 Vyawan Marketplace. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Privacy Policy', 'Terms of Service', 'Help Center'].map(l => (
            <span key={l} style={{ fontSize: 12, color: MUTED, cursor: 'pointer', textDecoration: 'underline' }}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, googleLogin } = useAuth()

  const [role, setRole]               = useState<Role>('buyer')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember]       = useState(false)
  const [buyerCompany, setBuyerCompany] = useState(() => searchParams.get('company') || '')
  const [showRegisterModal, setShowRegisterModal]           = useState(false)
  const [showBuyerRegisterModal, setShowBuyerRegisterModal] = useState(false)

  // Admin
  const [showAdmin, setShowAdmin]         = useState(false)
  const [adminEmail, setAdminEmail]       = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPw, setShowAdminPw]     = useState(false)
  const [clickCount, setClickCount]       = useState(0)
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
      // 1. If buyer, validate store code first
      if (role === 'buyer') {
        if (!buyerCompany) {
          setError('Store Access Code is required for buyers.');
          setLoading(false);
          return;
        }
        try {
          const company = await api.getCompanyByCode(buyerCompany);
          if (!company) {
            setError('The Store Access Code you entered was not found.');
            setLoading(false);
            return;
          }
          // Store for downstream filtering
          localStorage.setItem('directStoreAccess', buyerCompany);
        } catch (err: any) {
          setError(`Store Validation Error: ${err.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      // 2. Perform main login
      const user = await login(email, password)
      if (user.role !== role) { setError(`This account is a ${user.role}, not ${role}.`); return }
      
      // Always go to buyer dashboard — store code filters products there
      navigate(role === 'buyer' ? '/buyer/dashboard' : '/manufacturer/overview')
    } catch (err: any) { setError(err.message ?? 'Login failed.') }
    finally { setLoading(false) }
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

  const inputWrap: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    background: INPUT, border: `1.5px solid ${BORDER}`,
    borderRadius: 10, padding: '12px 14px',
  }
  const inputStyle: React.CSSProperties = {
    flex: 1, border: 'none', background: 'transparent', outline: 'none',
    fontSize: 14, color: BROWN, fontFamily: 'Inter, sans-serif',
  }

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  if (showAdmin) {
    return (
      <PageShell onLogoClick={handleLogoClick}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: CARD, borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 380, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', border: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: BROWN, margin: '0 0 4px' }}>Admin Login</h2>
          <p style={{ fontSize: 13, color: '#C47A2B', fontWeight: 600, margin: '0 0 1.5rem' }}>Restricted Access Only</p>
          {error && <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 12, border: '1px solid #FECACA' }}>{error}</div>}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={inputWrap}>
              <Mail size={16} color={MUTED} />
              <input type="email" placeholder="Admin email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div style={inputWrap}>
              <Lock size={16} color={MUTED} />
              <input type={showAdminPw ? 'text' : 'password'} placeholder="Password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required style={inputStyle} />
              <button type="button" onClick={() => setShowAdminPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 0 }}>
                {showAdminPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '13px', borderRadius: 10, background: BROWN, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </motion.div>
      </PageShell>
    )
  }

  // ── BUYER / MANUFACTURER ───────────────────────────────────────────────────
  return (
    <>
      <PageShell onLogoClick={handleLogoClick}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ background: CARD, borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 380, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', border: `1px solid ${BORDER}` }}>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: BROWN, margin: '0 0 1.25rem' }}>Welcome Back</h2>

          {/* Role toggle */}
          <div style={{ display: 'flex', background: INPUT, borderRadius: 10, padding: 3, marginBottom: '1.5rem', border: `1px solid ${BORDER}` }}>
            {(['buyer', 'manufacturer'] as Role[]).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                  background: role === r ? CARD : 'transparent',
                  color: role === r ? BROWN : MUTED,
                  boxShadow: role === r ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                {r === 'buyer' ? 'Buyer' : 'Manufacturer'}
              </button>
            ))}
          </div>

          {/* Sourcing badge */}
          <AnimatePresence>
            {buyerCompany && role === 'buyer' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: MID, background: '#FCE7D6', padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  🏭 Sourcing from: {buyerCompany}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 12, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: BROWN, marginBottom: 6, display: 'block' }}>Business Email</label>
            <div style={{ ...inputWrap, marginBottom: 14 }}>
              <Mail size={16} color={MUTED} />
              <input type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            </div>

            {role === 'buyer' && (
              <>
                <label style={{ fontSize: 13, fontWeight: 500, color: BROWN, marginBottom: 6, display: 'block' }}>Store Access Code</label>
                <div style={{ ...inputWrap, marginBottom: 14 }}>
                  <Archive size={16} color={MUTED} />
                  <input 
                    type="text" 
                    placeholder="e.g. MNG-101" 
                    value={buyerCompany} 
                    onChange={e => setBuyerCompany(e.target.value.toUpperCase())} 
                    required 
                    style={inputStyle} 
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: BROWN }}>Password</label>
              <span style={{ fontSize: 13, fontWeight: 600, color: BROWN, cursor: 'pointer' }}>Forgot password?</span>
            </div>
            <div style={{ ...inputWrap, marginBottom: 14 }}>
              <Lock size={16} color={MUTED} />
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 0 }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUTED, marginBottom: 18, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: BROWN, cursor: 'pointer' }} />
              Remember this device
            </label>

            <button type="submit" disabled={loading}
              style={{ padding: '13px', borderRadius: 10, background: BROWN, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div style={{ height: 1, background: BORDER, margin: '1.25rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: 14, color: MUTED, margin: 0 }}>
            Don't have an account?{' '}
            <span onClick={() => role === 'buyer' ? setShowBuyerRegisterModal(true) : setShowRegisterModal(true)}
              style={{ color: BROWN, fontWeight: 600, cursor: 'pointer' }}>
              Sign up for free
            </span>
          </p>
        </motion.div>
      </PageShell>

      {showRegisterModal && (
        <ManufacturerRegisterModal open={showRegisterModal} onClose={() => setShowRegisterModal(false)} onSuccess={() => { setShowRegisterModal(false); navigate('/manufacturer/overview') }} />
      )}
      {showBuyerRegisterModal && (
        <BuyerRegisterModal open={showBuyerRegisterModal} onClose={() => setShowBuyerRegisterModal(false)} onSuccess={() => { setShowBuyerRegisterModal(false); navigate('/buyer/dashboard') }} />
      )}
    </>
  )
}
