import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Search } from 'lucide-react'
import '@/styles/loginPage.css'
import ManufacturerRegisterModal from '@/features/manufacturer/RegisterModal'
import BuyerRegisterModal from '@/features/buyer/BuyerRegisterModal'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showBuyerRegisterModal, setShowBuyerRegisterModal] = useState(false)

  // Buyer form
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPassword, setBuyerPassword] = useState('')
  const [buyerCompany, setBuyerCompany] = useState('')

  // Manufacturer login form
  const [mfrEmail, setMfrEmail] = useState('')
  const [mfrPassword, setMfrPassword] = useState('')

  // Buyer register form — removed (no signup flow)

  // Admin form
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  const handleBuyerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(buyerEmail, buyerPassword)
      if (user.role !== 'buyer') {
        setError(`This account is registered as a ${user.role}, not buyer.`)
        return
      }
      navigate('/buyer/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyerSignup = () => navigate('/buyer/browse')

  const handleBrowseCompany = () => {
    navigate('/buyer/browse')
  }

  const handleManufacturerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(mfrEmail, mfrPassword)
      if (user.role !== 'manufacturer') {
        setError(`This account is registered as a ${user.role}, not manufacturer.`)
        return
      }
      navigate('/manufacturer/overview')
    } catch (err: any) {
      setError(err.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(adminEmail, adminPassword)
      if (user.role !== 'admin') {
        setError(`This account is registered as a ${user.role}, not admin.`)
        return
      }
      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Floating background shapes */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      <div className="login-container">
        {/* Logo */}
        <div className="logo-section">
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

        <div className="cards-wrapper">
          {/* ── BUYER CARD ── */}
          <div className="login-card">
            <div className="illustration-container">
              <img
                src="https://customer-assets.emergentagent.com/job_multi-role-auth-3/artifacts/7z594tiw_image.png"
                alt="Buyer"
                className="card-illustration"
              />
            </div>
            <h2 className="card-title">Buyer</h2>
            <p className="card-subtitle">Access your buyer dashboard</p>

            <form onSubmit={handleBuyerLogin} className="login-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="form-input"
                  value={buyerEmail}
                  onChange={e => setBuyerEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  className="form-input"
                  value={buyerPassword}
                  onChange={e => setBuyerPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter Company Name"
                  className="form-input"
                  value={buyerCompany}
                  onChange={e => setBuyerCompany(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={handleBrowseCompany}
                className="browse-btn"
              >
                <Search size={18} />
                <span>Browse Company</span>
              </button>

              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Loading...' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/buyer/browse')}
                  className="btn btn-secondary"
                >
                  Browse
                </button>
              </div>

              <p className="footer-text">
                New here?{' '}
                <span className="link-text" onClick={() => setShowBuyerRegisterModal(true)}>
                  Create your buyer account
                </span>
              </p>
            </form>
          </div>

          {/* ── MANUFACTURER CARD ── */}
          <div className="login-card manufacturer-card">
                <div className="illustration-container">
                  <img
                    src="https://customer-assets.emergentagent.com/job_multi-role-auth-3/artifacts/mjbr6hlk_image.png"
                    alt="Manufacturer"
                    className="card-illustration"
                  />
                </div>
                <h2 className="card-title">Manufacturer</h2>
                <p className="card-subtitle">Manage your business operations</p>

                <form onSubmit={handleManufacturerLogin} className="login-form">
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="form-input"
                      value={mfrEmail}
                      onChange={e => setMfrEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Password"
                      className="form-input"
                      value={mfrPassword}
                      onChange={e => setMfrPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? 'Loading...' : 'Login'}
                  </button>

                  <p className="footer-text">
                    New here?{' '}
                    <span className="link-text" onClick={() => setShowRegisterModal(true)}>
                      Create your business account
                    </span>
                  </p>
                </form>
          </div>

          {/* ── ADMIN CARD ── */}
          <div className="login-card">
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
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  className="form-input"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
              </button>

              <p className="footer-text admin-footer">
                Contact administrator for access
              </p>
            </form>
          </div>
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
