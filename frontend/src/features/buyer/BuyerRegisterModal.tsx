import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import {
  X, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Phone, Mail, Lock,
  Building2, FileText, Loader2, CheckCircle2, AlertCircle, Upload
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const STEP_LABELS = ['Account', 'Company', 'Documents']

export default function BuyerRegisterModal({ open, onClose, onSuccess }: Props) {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // -- Step 1: Account --
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')

  useEffect(() => {
    if (!open) {
      setError('')
      setOtpSent(false)
      setOtpVerified(false)
      setOtp('')
    }
  }, [open])

  if (!open) return null

  function validate(): string {
    if (!name) return 'Full Name is required.'
    if (!email) return 'Email is required.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (!phone) return 'Phone number is required.'
    if (!otpSent) return 'Please send OTP first.'
    if (!otpVerified) return 'Please verify your phone number.'
    return ''
  }

  async function handleSendOtp() {
    if (!phone) { setError('Enter phone number first'); return }
    setOtpLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 800))
    setOtpSent(true)
    setOtpMessage('OTP sent to your phone (Use 123456)')
    setOtpLoading(false)
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return }
    setOtpLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 1000))
    if (otp === '123456' || otp === '000000') {
      setOtpVerified(true)
      setOtpMessage('Phone verified!')
    } else {
      setError('Invalid OTP. Use 123456.')
    }
    setOtpLoading(false)
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setSubmitting(true)
    setError('')
    try {
      await register({
        name,
        email,
        password,
        role: 'buyer'
      })
      onSuccess()
    } catch (e: any) {
      setError(e.message ?? 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-10">
          <X size={20} className="text-slate-400" />
        </button>

        <div className="p-8 pb-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Buyer Registration</h2>
            <p className="text-sm text-slate-500 mt-1">Join Sephio as a business buyer</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-red-50 text-red-500 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="px-8 pb-8 overflow-y-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1">Full Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  placeholder="business@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-12 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={otpLoading || (otpSent && otpVerified)}
                className={`h-[46px] mt-6 px-4 rounded-2xl text-xs font-bold transition-all ${
                  (otpSent && otpVerified) ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {otpLoading ? <Loader2 size={16} className="animate-spin" /> : (otpSent && otpVerified) ? 'Verified ✓' : otpSent ? 'Resend' : 'Send OTP'}
              </button>
            </div>

            {otpMessage && (
              <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg border ${
                otpVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
              }`}>
                {otpVerified ? <CheckCircle2 size={12} /> : <Loader2 size={12} className="animate-spin" />}
                {otpMessage}
              </div>
            )}

            {otpSent && !otpVerified && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Verification Code</label>
                <input
                  className="w-full px-4 py-3 rounded-2xl border border-indigo-500 bg-indigo-50 text-center tracking-[1rem] text-lg font-bold focus:outline-none"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="000000"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || otpLoading}
                  className="w-full py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold mt-2 hover:bg-black transition-all"
                >
                  {otpLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}
          </motion.div>
        </div>

        <div className="p-8 pt-0">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white text-base font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-70"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Complete Setup & Browse Products'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
