import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import {
  X, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Phone, Mail, Lock,
  Building2, FileText, MapPin, CreditCard, Image as ImageIcon, Loader2,
  CheckCircle2, AlertCircle, Upload, Factory, Plus,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { open: boolean; onClose: () => void; onSuccess: () => void }

const CATEGORIES: Record<string, string[]> = {
  Textiles:     ['Saree', 'Denim', 'Shirting', 'Suiting', 'Knits', 'Technical Textiles'],
  Electronics:  ['Consumer Electronics', 'Industrial Electronics', 'PCB', 'Semiconductors'],
  Machinery:    ['CNC Machines', 'Packaging Machines', 'Textile Machines', 'Food Processing'],
  FMCG:         ['Personal Care', 'Food & Beverage', 'Household', 'Healthcare'],
  Automotive:   ['Auto Parts', 'EV Components', 'Tyres', 'Accessories'],
  Construction: ['Cement', 'Steel', 'Tiles', 'Plumbing', 'Electrical'],
  Chemicals:    ['Industrial Chemicals', 'Agrochemicals', 'Specialty Chemicals'],
  Agriculture:  ['Seeds', 'Fertilizers', 'Farm Equipment', 'Organic Products'],
  Pharmaceuticals: ['Formulations', 'APIs', 'Medical Devices', 'Nutraceuticals'],
  'Home & Furniture': ['Wooden Furniture', 'Metal Furniture', 'Upholstered', 'Outdoor'],
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
]

const STEP_LABELS = ['Account', 'Company', 'Documents', 'Location', 'Bank', 'Media']
const CERT_SUGGESTIONS = ['ISO 9001', 'ISO 14001', 'BIS', 'CE Marking', 'GOTS', 'OEKO-TEX', 'Fair Trade', 'FSSAI', 'GMP']

type GstStatus = 'idle' | 'validating' | 'valid' | 'invalid'
type IfscStatus = 'idle' | 'fetching' | 'found'
type PennyStatus = 'idle' | 'loading' | 'verified'

const inp = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
const lbl = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide"

export default function ManufacturerRegisterModal({ open, onClose, onSuccess }: Props) {
  const { register } = useAuth()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)

  // Step 2
  const [companyName, setCompanyName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [description, setDescription] = useState('')
  const [mainCategory, setMainCategory] = useState('')
  const [subCategories, setSubCategories] = useState<string[]>([])
  const [capacity, setCapacity] = useState('')
  const [yearEst, setYearEst] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')

  // Step 3
  const [gstNumber, setGstNumber] = useState('')
  const [gstStatus, setGstStatus] = useState<GstStatus>('idle')
  const [panNumber, setPanNumber] = useState('')
  const [msmeNumber, setMsmeNumber] = useState('')
  const [cinNumber, setCinNumber] = useState('')
  const [bizDocUrl, setBizDocUrl] = useState('')
  const [gstCertUrl, setGstCertUrl] = useState('')

  // Step 4
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [locationState, setLocationState] = useState('')
  const [pincode, setPincode] = useState('')
  const [mapLoading, setMapLoading] = useState(false)

  // Step 5
  const [accountNumber, setAccountNumber] = useState('')
  const [confirmAccount, setConfirmAccount] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [ifscStatus, setIfscStatus] = useState<IfscStatus>('idle')
  const [bankDetails, setBankDetails] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [pennyDropStatus, setPennyDropStatus] = useState<PennyStatus>('idle')

  // Step 6
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [factoryPhotos, setFactoryPhotos] = useState<string[]>([])
  const [photoInput, setPhotoInput] = useState('')
  const [certifications, setCertifications] = useState<string[]>([])
  const [certInput, setCertInput] = useState('')

  useEffect(() => { if (!open) { setStep(0); setError('') } }, [open])

  useEffect(() => {
    if (gstNumber.length === 15) {
      setGstStatus('validating')
      const t = setTimeout(() => setGstStatus('valid'), 1500)
      return () => clearTimeout(t)
    } else if (gstNumber.length > 0) { setGstStatus('idle') }
  }, [gstNumber])

  useEffect(() => {
    if (ifscCode.length === 11) {
      setIfscStatus('fetching')
      const t = setTimeout(() => {
        setIfscStatus('found')
        setBankDetails('State Bank of India, Andheri East')
        setBankName('State Bank of India')
      }, 1000)
      return () => clearTimeout(t)
    } else { setIfscStatus('idle'); setBankDetails('') }
  }, [ifscCode])

  if (!open) return null

  function validateStep(): string {
    switch (step) {
      case 0:
        if (!email) return 'Email is required.'
        if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email address.'
        if (password.length < 6) return 'Password must be at least 6 characters.'
        if (!phone || phone.replace(/\D/g, '').length < 10) return 'Enter a valid 10-digit phone number.'
        if (!otpSent) return 'Please send OTP to verify your phone number.'
        if (!otpVerified) return 'Please verify your phone number with the OTP.'
        return ''
      case 1:
        if (!companyName.trim()) return 'Company legal name is required.'
        if (!mainCategory) return 'Please select a product category.'
        return ''
      case 2:
        if (gstNumber.length !== 15) return 'GST Number must be exactly 15 characters.'
        if (gstStatus !== 'valid') return 'Please wait for GST validation to complete.'
        if (panNumber.length !== 10) return 'PAN Number must be exactly 10 characters.'
        return ''
      case 3:
        if (!city.trim()) return 'City is required.'
        if (!locationState) return 'Please select your state.'
        if (pincode.replace(/\D/g, '').length !== 6) return 'PIN Code must be 6 digits.'
        return ''
      case 4:
        if (!accountNumber) return 'Account number is required.'
        if (accountNumber !== confirmAccount) return 'Account numbers do not match.'
        if (!bankName.trim()) return 'Bank name is required.'
        return ''
      case 5:
        if (factoryPhotos.length < 2) return 'Please add at least 2 factory photos.'
        return ''
      default: return ''
    }
  }

  async function handleSendOtp() {
    if (!phone || phone.replace(/\D/g, '').length < 10) { setError('Enter a valid 10-digit phone number.'); return }
    setOtpLoading(true); setError('')
    await new Promise(r => setTimeout(r, 800))
    setOtpSent(true)
    setOtpMessage(`OTP sent to +91 ****${phone.slice(-4)}`)
    setOtpLoading(false)
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return }
    setOtpLoading(true); setError('')
    await new Promise(r => setTimeout(r, 1000))
    if (otp === '123456' || otp === '000000') {
      setOtpVerified(true)
      setOtpMessage('Phone number verified successfully!')
    } else { setError('Invalid OTP. Use 123456 for testing.') }
    setOtpLoading(false)
  }

  async function handleCreateAccount() {
    const err = validateStep(); if (err) { setError(err); return }
    setSubmitting(true); setError('')
    try {
      await register({ name: companyName || email.split('@')[0], email, password, role: 'manufacturer' })
      goNext()
    } catch (e: any) { setError(e.message ?? 'Registration failed. Email may already be in use.') }
    finally { setSubmitting(false) }
  }

  async function handleSubmit() {
    const err = validateStep(); if (err) { setError(err); return }
    setSubmitting(true); setError('')
    try {
      await api.saveManufacturerProfile({
        companyName, tradeName, description,
        categories: subCategories.length ? subCategories : [mainCategory],
        mainCategory, capacity, yearEstablished: yearEst, employeeCount,
        gstNumber, panNumber, msmeNumber, cinNumber, bizDocUrl, gstCertUrl,
        address: { street, city, state: locationState, pincode },
        bank: { accountNumber, ifscCode, bankName, accountHolderName },
        logoUrl, bannerUrl, factoryPhotos, certifications,
      })
      onSuccess()
    } catch (e: any) { setError(e.message ?? 'Failed to save profile. Please try again.') }
    finally { setSubmitting(false) }
  }

  function goNext() {
    const err = validateStep(); if (err) { setError(err); return }
    setError(''); setDirection(1); setStep(s => Math.min(s + 1, 5))
  }
  function goPrev() { setError(''); setDirection(-1); setStep(s => Math.max(s - 1, 0)) }

  async function handlePennyDrop() {
    if (!accountNumber || !bankName) { setError('Enter account number and bank name first.'); return }
    setPennyDropStatus('loading')
    await new Promise(r => setTimeout(r, 2000))
    setPennyDropStatus('verified')
  }

  function handleMapClick() {
    setMapLoading(true)
    setTimeout(() => {
      setMapLoading(false)
      setStreet('Industrial Area, Phase 2, Plot 45')
      setCity('Mumbai'); setLocationState('Maharashtra'); setPincode('400001')
    }, 1800)
  }

  function addPhoto() {
    const url = photoInput.trim()
    if (!url || factoryPhotos.length >= 10) return
    setFactoryPhotos(p => [...p, url]); setPhotoInput('')
  }

  function toggleSubCat(cat: string) {
    setSubCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  function addCert(c: string) {
    if (!c.trim() || certifications.includes(c)) return
    setCertifications(p => [...p, c]); setCertInput('')
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -50 : 50, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full bg-white overflow-hidden flex flex-col"
        style={{ maxWidth: '640px', maxHeight: '92vh', borderRadius: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-10">
          <motion.div className="h-full" style={{ background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }}
            animate={{ width: `${(step / 5) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-7 pt-7 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
                <Factory size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Manufacturer Registration</h2>
                <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of 6 — {STEP_LABELS[step]}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center mt-5 gap-1">
            {STEP_LABELS.map((label, i) => {
              const done = i < step; const active = i === step
              return (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0"
                      style={{ background: done ? '#10B981' : active ? '#6366F1' : '#F3F4F6', color: done || active ? '#fff' : '#9CA3AF' }}>
                      {done ? <Check size={12} /> : i + 1}
                    </div>
                    <span className="text-[9px] mt-1 font-semibold whitespace-nowrap"
                      style={{ color: active ? '#6366F1' : done ? '#10B981' : '#9CA3AF' }}>{label}</span>
                  </div>
                  {i < 5 && <div className="flex-1 h-0.5 mx-1 mb-3 rounded-full"
                    style={{ background: done ? '#10B981' : '#E5E7EB' }} />}
                </div>
              )
            })}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-3 px-4 py-3 rounded-xl text-sm"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                <AlertCircle size={15} className="flex-shrink-0" />{error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-7 pb-4" style={{ minHeight: 0 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}>
              {step === 0 && (
                <StepAccount
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  showPassword={showPassword} setShowPassword={setShowPassword}
                  phone={phone} setPhone={setPhone}
                  otp={otp} setOtp={setOtp}
                  otpSent={otpSent} otpLoading={otpLoading}
                  otpMessage={otpMessage} otpVerified={otpVerified}
                  onSendOtp={handleSendOtp} onVerifyOtp={handleVerifyOtp}
                />
              )}
              {step === 1 && (
                <StepCompany
                  companyName={companyName} setCompanyName={setCompanyName}
                  tradeName={tradeName} setTradeName={setTradeName}
                  description={description} setDescription={setDescription}
                  mainCategory={mainCategory} setMainCategory={setMainCategory}
                  subCategories={subCategories} toggleSubCat={toggleSubCat}
                  capacity={capacity} setCapacity={setCapacity}
                  yearEst={yearEst} setYearEst={setYearEst}
                  employeeCount={employeeCount} setEmployeeCount={setEmployeeCount}
                />
              )}
              {step === 2 && (
                <StepDocuments
                  gstNumber={gstNumber} setGstNumber={setGstNumber} gstStatus={gstStatus}
                  panNumber={panNumber} setPanNumber={setPanNumber}
                  msmeNumber={msmeNumber} setMsmeNumber={setMsmeNumber}
                  cinNumber={cinNumber} setCinNumber={setCinNumber}
                  bizDocUrl={bizDocUrl} setBizDocUrl={setBizDocUrl}
                  gstCertUrl={gstCertUrl} setGstCertUrl={setGstCertUrl}
                />
              )}
              {step === 3 && (
                <StepLocation
                  street={street} setStreet={setStreet}
                  city={city} setCity={setCity}
                  locationState={locationState} setLocationState={setLocationState}
                  pincode={pincode} setPincode={setPincode}
                  onMapClick={handleMapClick} mapLoading={mapLoading}
                />
              )}
              {step === 4 && (
                <StepBank
                  accountNumber={accountNumber} setAccountNumber={setAccountNumber}
                  confirmAccount={confirmAccount} setConfirmAccount={setConfirmAccount}
                  ifscCode={ifscCode} setIfscCode={setIfscCode}
                  ifscStatus={ifscStatus} bankDetails={bankDetails}
                  bankName={bankName} setBankName={setBankName}
                  accountHolderName={accountHolderName} setAccountHolderName={setAccountHolderName}
                  pennyDropStatus={pennyDropStatus} onPennyDrop={handlePennyDrop}
                />
              )}
              {step === 5 && (
                <StepMedia
                  logoUrl={logoUrl} setLogoUrl={setLogoUrl}
                  bannerUrl={bannerUrl} setBannerUrl={setBannerUrl}
                  factoryPhotos={factoryPhotos} photoInput={photoInput}
                  setPhotoInput={setPhotoInput} onAddPhoto={addPhoto}
                  onRemovePhoto={(i: number) => setFactoryPhotos(p => p.filter((_, idx) => idx !== i))}
                  certifications={certifications} certInput={certInput}
                  setCertInput={setCertInput}
                  onAddCert={() => addCert(certInput)}
                  onAddCertDirect={(c: string) => addCert(c)}
                  onRemoveCert={(c: string) => setCertifications(p => p.filter(x => x !== c))}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex-shrink-0 px-7 py-5 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={goPrev} disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft size={15} /> Back
          </button>
          {step === 0 ? (
            <button onClick={handleCreateAccount} disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Verify &amp; Continue
            </button>
          ) : step === 5 ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Complete Registration
            </button>
          ) : (
            <button onClick={goNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
              Continue <ChevronRight size={15} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Account
// ─────────────────────────────────────────────────────────────────────────────
function StepAccount({ email, setEmail, password, setPassword, showPassword, setShowPassword,
  phone, setPhone, otp, setOtp, otpSent, otpLoading, otpMessage, otpVerified,
  onSendOtp, onVerifyOtp }: any) {
  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-base font-semibold text-gray-800 mb-0.5">Create your account</p>
        <p className="text-xs text-gray-400">Enter your credentials and verify your phone number</p>
      </div>

      {/* Email */}
      <div>
        <label className={lbl}>Email Address *</label>
        <div className="relative">
          <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="email" placeholder="you@company.com" className={inp + " pl-10"}
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className={lbl}>Password *</label>
        <div className="relative">
          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
            className={inp + " pl-10 pr-10"} value={password} onChange={e => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="flex gap-1 mt-1.5">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex-1 h-1 rounded-full transition-colors"
                style={{ background: password.length >= i * 2 ? (password.length >= 8 ? '#10B981' : '#F59E0B') : '#E5E7EB' }} />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">{password.length < 6 ? 'Weak' : password.length < 8 ? 'Fair' : 'Strong'}</span>
          </div>
        )}
      </div>

      {/* Phone + OTP */}
      <div>
        <label className={lbl}>Phone Number *</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" placeholder="+91 XXXXX XXXXX" className={inp + " pl-10"}
              value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <button type="button" onClick={onSendOtp}
            disabled={otpLoading || (otpSent && otpVerified)}
            className="px-4 py-3 rounded-xl text-sm font-semibold text-white flex-shrink-0 flex items-center gap-1.5 disabled:opacity-60 transition-all"
            style={{ background: otpVerified ? '#10B981' : '#6366F1' }}>
            {otpLoading ? <Loader2 size={14} className="animate-spin" /> : otpVerified ? <Check size={14} /> : null}
            {otpVerified ? 'Verified' : otpSent ? 'Resend' : 'Send OTP'}
          </button>
        </div>
      </div>

      {otpMessage && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: otpVerified ? '#ECFDF5' : '#EEF2FF', color: otpVerified ? '#059669' : '#6366F1' }}>
          {otpVerified ? <CheckCircle2 size={14} /> : <Loader2 size={14} className="animate-spin" />}
          {otpMessage}
        </div>
      )}

      {otpSent && !otpVerified && (
        <div className="space-y-2">
          <label className={lbl}>Enter OTP</label>
          <input type="text" placeholder="6-digit OTP" maxLength={6}
            className={inp + " text-center tracking-[0.4em] text-lg font-bold"}
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          <button type="button" onClick={onVerifyOtp} disabled={otp.length !== 6 || otpLoading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: '#1E293B' }}>
            {otpLoading ? 'Verifying...' : 'Verify Phone Number'}
          </button>
          <p className="text-xs text-center text-gray-400">Use <strong>123456</strong> for testing</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Company Info
// ─────────────────────────────────────────────────────────────────────────────
function StepCompany({ companyName, setCompanyName, tradeName, setTradeName,
  description, setDescription, mainCategory, setMainCategory,
  subCategories, toggleSubCat, capacity, setCapacity,
  yearEst, setYearEst, employeeCount, setEmployeeCount }: any) {
  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-base font-semibold text-gray-800 mb-0.5">Company Information</p>
        <p className="text-xs text-gray-400">Tell buyers about your manufacturing business</p>
      </div>

      <div>
        <label className={lbl}>Company Legal Name *</label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="As per registration documents" className={inp + " pl-10"}
            value={companyName} onChange={e => setCompanyName(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={lbl}>Trade Name <span className="text-gray-400 normal-case font-normal">(if different)</span></label>
        <input type="text" placeholder="Brand / trade name" className={inp}
          value={tradeName} onChange={e => setTradeName(e.target.value)} />
      </div>

      <div>
        <label className={lbl}>Short Description</label>
        <textarea rows={3} placeholder="What do you manufacture? Buyers will see this on your storefront."
          className={inp + " resize-none"} value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {/* Main Category */}
      <div>
        <label className={lbl}>Main Product Category *</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(CATEGORIES).map(cat => (
            <button key={cat} type="button" onClick={() => { setMainCategory(cat) }}
              className="px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border"
              style={{
                background: mainCategory === cat ? '#EEF2FF' : '#F9FAFB',
                borderColor: mainCategory === cat ? '#6366F1' : '#E5E7EB',
                color: mainCategory === cat ? '#6366F1' : '#374151',
              }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Categories */}
      {mainCategory && CATEGORIES[mainCategory] && (
        <div>
          <label className={lbl}>Sub-categories <span className="text-gray-400 normal-case font-normal">(select all that apply)</span></label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES[mainCategory].map(sub => (
              <button key={sub} type="button" onClick={() => toggleSubCat(sub)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                style={{
                  background: subCategories.includes(sub) ? '#6366F1' : '#F3F4F6',
                  borderColor: subCategories.includes(sub) ? '#6366F1' : '#E5E7EB',
                  color: subCategories.includes(sub) ? '#fff' : '#6B7280',
                }}>
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Capacity</label>
          <div className="relative">
            <input type="number" placeholder="Units/month" className={inp + " pr-16"}
              value={capacity} onChange={e => setCapacity(e.target.value)} min={0} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">units</span>
          </div>
        </div>
        <div>
          <label className={lbl}>Year Est.</label>
          <input type="number" placeholder="e.g. 2005" className={inp}
            value={yearEst} onChange={e => setYearEst(e.target.value)} min={1900} max={2024} />
        </div>
        <div>
          <label className={lbl}>Employees</label>
          <input type="number" placeholder="e.g. 50" className={inp}
            value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} min={1} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Legal Documents
// ─────────────────────────────────────────────────────────────────────────────
function StepDocuments({ gstNumber, setGstNumber, gstStatus, panNumber, setPanNumber,
  msmeNumber, setMsmeNumber, cinNumber, setCinNumber,
  bizDocUrl, setBizDocUrl, gstCertUrl, setGstCertUrl }: any) {
  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-base font-semibold text-gray-800 mb-0.5">Legal Documents</p>
        <p className="text-xs text-gray-400">Required for verification and compliance</p>
      </div>

      {/* GST */}
      <div>
        <label className={lbl}>GST Number * <span className="text-gray-400 normal-case font-normal">(15 characters)</span></label>
        <div className="relative">
          <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="22AAAAA0000A1Z5" maxLength={15}
            className={inp + " pl-10 pr-32 uppercase font-mono tracking-wider"}
            value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase().slice(0, 15))} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold">
            {gstStatus === 'validating' && <><Loader2 size={12} className="animate-spin text-indigo-500" /><span className="text-indigo-500">Validating...</span></>}
            {gstStatus === 'valid' && <><CheckCircle2 size={12} style={{ color: '#10B981' }} /><span style={{ color: '#10B981' }}>Verified</span></>}
            {gstStatus === 'invalid' && <><AlertCircle size={12} style={{ color: '#EF4444' }} /><span style={{ color: '#EF4444' }}>Invalid</span></>}
            {gstStatus === 'idle' && gstNumber.length > 0 && <span className="text-gray-400">{gstNumber.length}/15</span>}
          </span>
        </div>
      </div>

      {/* PAN */}
      <div>
        <label className={lbl}>PAN Number * <span className="text-gray-400 normal-case font-normal">(10 characters)</span></label>
        <input type="text" placeholder="AAAAA0000A" maxLength={10}
          className={inp + " uppercase font-mono tracking-wider"}
          value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase().slice(0, 10))} />
        {panNumber.length > 0 && panNumber.length < 10 && (
          <p className="text-xs text-gray-400 mt-1">{panNumber.length}/10 characters</p>
        )}
        {panNumber.length === 10 && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10B981' }}>
            <CheckCircle2 size={11} /> PAN format valid
          </p>
        )}
      </div>

      {/* MSME */}
      <div>
        <label className={lbl}>MSME / Udyam Number <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
        <input type="text" placeholder="UDYAM-XX-00-0000000" className={inp}
          value={msmeNumber} onChange={e => setMsmeNumber(e.target.value)} />
      </div>

      {/* CIN */}
      <div>
        <label className={lbl}>CIN Number <span className="text-gray-400 normal-case font-normal">(optional, for Pvt Ltd / Ltd)</span></label>
        <input type="text" placeholder="U12345MH2005PTC123456" className={inp + " uppercase"}
          value={cinNumber} onChange={e => setCinNumber(e.target.value.toUpperCase())} />
      </div>

      {/* Document URLs */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
          <Upload size={12} /> Document URLs <span className="font-normal text-gray-400">(upload to Cloudinary, paste URL)</span>
        </p>
        <div>
          <label className={lbl}>Business Registration Doc</label>
          <input type="url" placeholder="https://res.cloudinary.com/..." className={inp}
            value={bizDocUrl} onChange={e => setBizDocUrl(e.target.value)} />
        </div>
        <div>
          <label className={lbl}>GST Certificate</label>
          <input type="url" placeholder="https://res.cloudinary.com/..." className={inp}
            value={gstCertUrl} onChange={e => setGstCertUrl(e.target.value)} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Factory Location
// ─────────────────────────────────────────────────────────────────────────────
function StepLocation({ street, setStreet, city, setCity, locationState, setLocationState,
  pincode, setPincode, onMapClick, mapLoading }: any) {
  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-base font-semibold text-gray-800 mb-0.5">Factory Location</p>
        <p className="text-xs text-gray-400">Your registered factory / warehouse address</p>
      </div>

      <div>
        <label className={lbl}>Street Address</label>
        <div className="relative">
          <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Building, Street, Area, Locality" className={inp + " pl-10"}
            value={street} onChange={e => setStreet(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>City *</label>
          <input type="text" placeholder="e.g. Mumbai" className={inp}
            value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <div>
          <label className={lbl}>PIN Code *</label>
          <input type="text" placeholder="6-digit PIN" maxLength={6} className={inp}
            value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        </div>
      </div>

      <div>
        <label className={lbl}>State *</label>
        <select className={inp} value={locationState} onChange={e => setLocationState(e.target.value)}>
          <option value="">Select State</option>
          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Google Maps placeholder */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1.5px dashed #CBD5E1' }}>
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-28 flex items-center justify-center relative">
          <div className="text-center">
            <MapPin size={24} className="mx-auto mb-1 text-slate-400" />
            <p className="text-xs text-slate-500 font-medium">Google Maps — Drop a pin to auto-fill address</p>
          </div>
        </div>
        <div className="px-4 py-3 bg-white flex items-center justify-between">
          <p className="text-xs text-gray-400">Click to pin your factory location</p>
          <button type="button" onClick={onMapClick} disabled={mapLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
            style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE' }}>
            {mapLoading ? <><Loader2 size={12} className="animate-spin" /> Pinning...</> : <><MapPin size={12} /> Drop Pin</>}
          </button>
        </div>
      </div>

      {city && locationState && pincode && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
          style={{ background: '#ECFDF5', color: '#059669' }}>
          <CheckCircle2 size={13} />
          {street && `${street}, `}{city}, {locationState} — {pincode}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — Bank Details
// ─────────────────────────────────────────────────────────────────────────────
function StepBank({ accountNumber, setAccountNumber, confirmAccount, setConfirmAccount,
  ifscCode, setIfscCode, ifscStatus, bankDetails, bankName, setBankName,
  accountHolderName, setAccountHolderName, pennyDropStatus, onPennyDrop }: any) {
  const mismatch = confirmAccount.length > 0 && accountNumber !== confirmAccount
  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-base font-semibold text-gray-800 mb-0.5">Bank Details</p>
        <p className="text-xs text-gray-400">For receiving payments and settlements</p>
      </div>

      <div>
        <label className={lbl}>Account Holder Name *</label>
        <input type="text" placeholder="Name as per bank records" className={inp}
          value={accountHolderName} onChange={e => setAccountHolderName(e.target.value)} />
      </div>

      <div>
        <label className={lbl}>Account Number *</label>
        <div className="relative">
          <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Bank account number" className={inp + " pl-10"}
            value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>

      <div>
        <label className={lbl}>Confirm Account Number *</label>
        <input type="text" placeholder="Re-enter account number"
          className={inp + (mismatch ? ' border-red-400 focus:border-red-400 focus:ring-red-400/10' : '')}
          value={confirmAccount} onChange={e => setConfirmAccount(e.target.value.replace(/\D/g, ''))} />
        {mismatch && <p className="text-xs mt-1 text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Account numbers do not match</p>}
        {!mismatch && confirmAccount.length > 0 && accountNumber === confirmAccount && (
          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10B981' }}><CheckCircle2 size={11} /> Account numbers match</p>
        )}
      </div>

      <div>
        <label className={lbl}>IFSC Code</label>
        <div className="relative">
          <input type="text" placeholder="11-character IFSC (e.g. SBIN0001234)" maxLength={11}
            className={inp + " uppercase font-mono tracking-wider pr-44"}
            value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase().slice(0, 11))} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium max-w-[160px] truncate">
            {ifscStatus === 'fetching' && <><Loader2 size={12} className="animate-spin text-indigo-500" /><span className="text-indigo-500">Looking up...</span></>}
            {ifscStatus === 'found' && <span style={{ color: '#10B981' }} className="truncate">{bankDetails}</span>}
          </span>
        </div>
      </div>

      <div>
        <label className={lbl}>Bank Name *</label>
        <input type="text" placeholder="e.g. State Bank of India" className={inp}
          value={bankName} onChange={e => setBankName(e.target.value)} />
      </div>

      {/* Penny Drop */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-amber-700 font-black text-sm"
            style={{ background: '#FEF3C7' }}>₹1</div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Penny Drop Verification</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              We transfer ₹1 to verify your bank account is active and correct. Amount is refunded within 24 hours.
            </p>
          </div>
        </div>
        {pennyDropStatus === 'idle' && (
          <button type="button" onClick={onPennyDrop} disabled={!accountNumber || !bankName}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: '#D97706' }}>
            Initiate ₹1 Penny Drop
          </button>
        )}
        {pennyDropStatus === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Loader2 size={14} className="animate-spin" /> Processing transfer...
          </div>
        )}
        {pennyDropStatus === 'verified' && (
          <div className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg"
            style={{ background: '#ECFDF5', color: '#059669' }}>
            <CheckCircle2 size={15} /> Bank account verified successfully
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — Profile Media
// ─────────────────────────────────────────────────────────────────────────────
function StepMedia({ logoUrl, setLogoUrl, bannerUrl, setBannerUrl,
  factoryPhotos, photoInput, setPhotoInput, onAddPhoto, onRemovePhoto,
  certifications, certInput, setCertInput, onAddCert, onAddCertDirect, onRemoveCert }: any) {
  return (
    <div className="space-y-5 py-2">
      <div>
        <p className="text-base font-semibold text-gray-800 mb-0.5">Profile Media</p>
        <p className="text-xs text-gray-400">Add your logo, banner and factory photos to build trust with buyers</p>
      </div>

      {/* Logo */}
      <div>
        <label className={lbl}>Company Logo URL</label>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ border: '2px dashed #CBD5E1', background: '#F8FAFC' }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              : <ImageIcon size={20} className="text-gray-300" />}
          </div>
          <input type="url" placeholder="https://res.cloudinary.com/your-logo.png" className={inp + " flex-1"}
            value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
        </div>
      </div>

      {/* Banner */}
      <div>
        <label className={lbl}>Banner Image URL</label>
        <input type="url" placeholder="https://res.cloudinary.com/your-banner.jpg" className={inp}
          value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} />
        {bannerUrl && (
          <div className="mt-2 rounded-xl overflow-hidden h-16 border border-gray-100">
            <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Factory Photos */}
      <div>
        <label className={lbl}>
          Factory Photos *
          <span className="text-gray-400 normal-case font-normal ml-1">
            (min 2, max 10 — first photo = Main)
          </span>
        </label>
        <div className="flex gap-2">
          <input type="url" placeholder="Photo URL" className={inp + " flex-1"}
            value={photoInput} onChange={e => setPhotoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddPhoto())} />
          <button type="button" onClick={onAddPhoto}
            disabled={!photoInput.trim() || factoryPhotos.length >= 10}
            className="px-4 py-3 rounded-xl text-sm font-semibold text-white flex-shrink-0 flex items-center gap-1 disabled:opacity-50"
            style={{ background: '#6366F1' }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {factoryPhotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {factoryPhotos.map((url: string, i: number) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-square"
                style={{ border: i === 0 ? '2px solid #6366F1' : '2px solid #E5E7EB' }}>
                <img src={url} alt={`Factory ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ background: '#6366F1' }}>MAIN</span>
                )}
                <button type="button" onClick={() => onRemovePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: '#EF4444' }}>
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-gray-400">{factoryPhotos.length}/10 photos added</p>
          {factoryPhotos.length < 2 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle size={11} /> At least 2 required
            </p>
          )}
          {factoryPhotos.length >= 2 && (
            <p className="text-xs flex items-center gap-1" style={{ color: '#10B981' }}>
              <CheckCircle2 size={11} /> Minimum met
            </p>
          )}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className={lbl}>Certifications</label>
        <div className="flex gap-2">
          <input type="text" placeholder="e.g. ISO 9001, BIS, CE Marking" className={inp + " flex-1"}
            value={certInput} onChange={e => setCertInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddCert())} />
          <button type="button" onClick={onAddCert} disabled={!certInput.trim()}
            className="px-4 py-3 rounded-xl text-sm font-semibold text-white flex-shrink-0 flex items-center gap-1 disabled:opacity-50"
            style={{ background: '#6366F1' }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {CERT_SUGGESTIONS.filter((s: string) => !certifications.includes(s)).map((s: string) => (
            <button key={s} type="button"
              onClick={() => onAddCertDirect(s)}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              + {s}
            </button>
          ))}
        </div>

        {certifications.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {certifications.map((c: string) => (
              <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: '#EEF2FF', color: '#6366F1' }}>
                <CheckCircle2 size={11} /> {c}
                <button type="button" onClick={() => onRemoveCert(c)} className="hover:opacity-70 ml-0.5">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
