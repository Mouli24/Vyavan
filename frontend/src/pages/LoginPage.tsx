import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff, ShoppingCart, Factory, ChevronDown } from 'lucide-react'
import '@/styles/loginPage.css'
import ManufacturerRegisterModal from '@/features/manufacturer/RegisterModal'
import BuyerRegisterModal from '@/features/buyer/BuyerRegisterModal'

type Role = 'buyer' | 'manufacturer'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()

  const [role, setRole] = useState<Role>('buyer')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Shared fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [buyerCompany, setBuyerCompany] = useState(() => {
    // pre-fill from URL ?company=... on first render
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('company') || ''
    }
    return ''
  })

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showBuyerRegisterModal, setShowBuyerRegisterModal] = useState(false)

  // Admin secret
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin#mybusiness') setShowAdmin(true)
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    // If company param present, switch to buyer role
    const company = searchParams.get('company')
    if (company) {
      setRole('buyer')
      setBuyerCompany(company)
    }
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Reset email/password when role changes (keep company name)
  useEffect(() => {
    setEmail(''); setPassword(''); setError('')
  }, [role])

  const handleLogoClick = () => {
    const now = Date.now()
    const newCount = now - lastClickTime < 1000 ? clickCount + 1 : 1
    setClickCount(newCount)
    setLastClickTime(now)
    if (newCount === 7) { setShowAdmin(true); setClickCount(0) }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role !== role) {
        setError(`This account is registered as a ${user.role}, not ${role}.`)
        return
      }
      navigate(role === 'buyer' ? '/buyer/dashboard' : '/manufacturer/overview')
    } catch (err: any) {
      setError(err.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(adminEmail, adminPassword)
      if (user.role !== 'admin') { setError('Not an admin account.'); return }
      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const ROLES: { value: Role; label: string; icon: React.ElementType; subtitle: string; img: string }[] = [
    {
      value: 'buyer',
      label: 'Buyer',
      icon: ShoppingCart,
      subtitle: 'Access your buyer dashboard',
      img: 'https://customer-assets.emergentagent.com/job_multi-role-auth-3/artifacts/7z594tiw_image.png',
    },
    {
      value: 'manufacturer',
      label: 'Manufacturer',
      icon: Factory,
      subtitle: 'Manage your business operations',
      img: 'https://customer-assets.emergentagent.com/job_multi-role-auth-3/artifacts/mjbr6hlk_image.png',
    },
  ]

  const activeRole = ROLES.find(r => r.value === role)!

  return (
    <div className="login-page">
      {/* Floating background shapes */}
      <div className="floating-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
        <div className="shape shape-4" />
      </div>

      <div className="login-container">
        {/* Logo */}
        <div className="logo-section" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img
            src="https://customer-assets.emergentagent.com/job_d333e98e-2138-4273-afc6-5e52eb4955aa/artifacts/3gk4c2ea_image.png"
            alt="B2BHarat"
            className="platform-logo"
          />
        </div>

        {error && (
          <div style={{ textAlign: 'center', color: '#EF4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* ── COMBINED CARD ── */}
        <div className="cards-wrapper">
          <div className="login-card" style={{ maxWidth: '440px', width: '100%' }}>

            {/* Illustration */}
            <div className="illustration-container">
              <AnimatePresence mode="wait">
                <motion.img
                  key={role}
                  src={activeRole.img}
                  alt={activeRole.label}
                  className="card-illustration"
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                />
              </AnimatePresence>
            </div>

            {/* Role dropdown toggle */}
            <div style={{ position: 'relative', marginBottom: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '14px',
                  border: '1.5px solid #E2E8F0',
                  background: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <activeRole.icon size={17} style={{ color: '#6366F1' }} />
                {activeRole.label}
                <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ marginLeft: 'auto' }}>
                  <ChevronDown size={16} style={{ color: '#94a3b8' }} />
                </motion.span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      borderRadius: '14px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      zIndex: 100,
                      overflow: 'hidden',
                    }}
                  >
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => { setRole(r.value); setDropdownOpen(false) }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '12px 16px',
                          background: role === r.value ? '#EEF2FF' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={e => { if (role !== r.value) (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                        onMouseLeave={e => { if (role !== r.value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: role === r.value ? '#6366F1' : '#F1F5F9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <r.icon size={17} style={{ color: role === r.value ? '#fff' : '#64748b' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{r.label}</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{r.subtitle}</p>
                        </div>
                        {role === r.value && (
                          <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Animated subtitle */}
            <AnimatePresence mode="wait">
              <motion.p
                key={role + '-sub'}
                className="card-subtitle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                style={{ marginTop: '4px', marginBottom: '12px' }}
              >
                {activeRole.subtitle}
              </motion.p>
            </AnimatePresence>

            {/* Login form */}
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Buyer-only: company name */}
              <AnimatePresence>
                {role === 'buyer' && (
                  <motion.div
                    className="form-group"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {buyerCompany && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#6366F1', fontWeight: 600, background: '#EEF2FF', padding: '2px 8px', borderRadius: '999px' }}>
                          🏭 Sourcing from: {buyerCompany}
                        </span>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Company Name (optional)"
                      className="form-input"
                      value={buyerCompany}
                      onChange={e => setBuyerCompany(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Signing in...' : `Sign in as ${activeRole.label}`}
              </button>

              <p className="footer-text" style={{ marginTop: '16px' }}>
                New here?{' '}
                <span
                  className="link-text"
                  onClick={() => role === 'buyer' ? setShowBuyerRegisterModal(true) : setShowRegisterModal(true)}
                >
                  {role === 'buyer' ? 'Create your buyer account' : 'Create your business account'}
                </span>
              </p>
            </form>
          </div>

          {/* ── ADMIN CARD (hidden, 7-click secret) ── */}
          {showAdmin && (
            <motion.div
              className="login-card admin-entrance"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ maxWidth: '360px', width: '100%' }}
            >
              <div className="illustration-container">
                <img
                  src="https://customer-assets.emergentagent.com/job_multi-role-auth-3/artifacts/ydgf82la_image.png"
                  alt="Admin"
                  className="card-illustration"
                />
              </div>
              <h2 className="card-title">Admin</h2>
              <p className="card-subtitle restricted-subtitle">Restricted Access Only</p>

              <form onSubmit={handleAdminLogin} className="login-form">
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="form-input"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="form-input"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    style={{ paddingRight: '44px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(v => !v)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Login'}
                </button>
                <p className="footer-text admin-footer">Contact administrator for access</p>
              </form>
            </motion.div>
          )}
        </div>
      </div>

      <ManufacturerRegisterModal
        open={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => { setShowRegisterModal(false); navigate('/manufacturer/onboarding') }}
      />
      <BuyerRegisterModal
        open={showBuyerRegisterModal}
        onClose={() => setShowBuyerRegisterModal(false)}
        onSuccess={() => { setShowBuyerRegisterModal(false); navigate('/buyer/dashboard') }}
      />
    </div>
  )
}
