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

  // Step 1 — Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)

  // Step 2 — Company
  const [companyName, setCompanyName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [description, setDescription] = useState('')
  const [mainCategory, setMainCategory] = useState('')
  const [subCategories, setSubCategories] = useState<string[]>([])
  const [capacity, setCapacity] = useState('')
  const [yearEst, setYearEst] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')

  // Step 3 — Documents
  const [gstNumber, setGstNumber] = useState('')
  const [gstStatus, setGstStatus] = useState<GstStatus>('idle')
  const [panNumber, setPanNumber] = useState('')
  const [msmeNumber, setMsmeNumber] = useState('')
  const [cinNumber, setCinNumber] = useState('')
  const [bizDocUrl, setBizDocUrl] = useState('')
  const [gstCertUrl, setGstCertUrl] = useState('')

  // Step 4 — Location
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [locationState, setLocationState] = useState('')
  const [pincode, setPincode] = useState('')
  const [mapLoading, setMapLoading] = useState(false)

  // Step 5 — Bank
  const [accountNumber, setAccountNumber] = useState('')
  const [confirmAccount, setConfirmAccount] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [ifscStatus, setIfscStatus] = useState<IfscStatus>('idle')
  const [bankDetails, setBankDetails] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [pennyDropStatus, setPennyDropStatus] = useState<PennyStatus>('idle')

  // Step 6 — Media
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
      const t = setTimeout(() => { setIfscStatus('found'); setBankDetails('State Bank of India, Andheri East'); setBankName('State Bank of India') }, 1000)
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
        if (!phone || phone.replace(/\D/g,'').length < 10) return 'Enter a valid 10-digit phone number.'
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
        if (pincode.replace(/\D/g,'').length !== 6) return 'PIN Code must be 6 digits.'
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
    if (!phone || phone.replace(/\D/g,'').length < 10) { setError('Enter a valid 10-digit phone number.'); return }
    setOtpLoading(true); setError('')
    await new Promise(r => setTimeout(r, 800))
    setOtpSent(true); setOtpMessage(`OTP sent to +91 ****${phone.slice(-4)}`)
    setOtpLoading(false)
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return }
    setOtpLoading(true); setError('')
    await new Promise(r => setTimeout(r, 1000))
    if (otp === '123456' || otp === '000000') {
      setOtpVerified(true); setOtpMessage('Phone number verified successfully!')
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
      await api.onboardManufacturer({
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
      setMapLoading(false); setStreet('Industrial Area, Phase 2, Plot 45')
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

  const progress = (step / 5) * 100

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full bg-white overflow-hidden flex flex-col"
        style={{ maxWidth: '640px', maxHeight: '92vh', borderRadius: '24px', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
      >
        {/* Top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-10">
          <motion.div className="h-full" style={{ background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-7 pt-7 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
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

          {/* Step dots */}
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
                    <span className="text-[9px] mt-1 font-semibold whitespace-nowrap" style={{ color: active ? '#6366F1' : done ? '#10B981' : '#9CA3AF' }}>{label}</span>
                  </div>
                  {i < 5 && <div className="flex-1 h-0.5 mx-1 mb-3 rounded-full" style={{ background: done ? '#10B981' : '#E5E7EB' }} />}
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
            <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: 'easeInOut' }}>
              {step === 0 && <StepAccount {...{ email, setEmail, password, setPassword, showPassword, setShowPassword, phone, setPhone, otp, setOtp, otpSent, otpLoading, otpMessage, otpVerified, onVerifyOtp: handleVerifyOtp, onSendOtp: handleSendOtp }} />}
              {step === 1 && <StepCompany {...{ companyName, setCompanyName, tradeName, setTradeName, description, setDescription, mainCategory, setMainCategory, subCategories, toggleSubCat, capacity, setCapacity, yearEst, setYearEst, employeeCount, setEmployeeCount }} />}
              {step === 2 && <StepDocuments {...{ gstNumber, setGstNumber, gstStatus, panNumber, setPanNumber, msmeNumber, setMsmeNumber, cinNumber, setCinNumber, bizDocUrl, setBizDocUrl, gstCertUrl, setGstCertUrl }} />}
              {step === 3 && <StepLocation {...{ street, setStreet, city, setCity, locationState, setLocationState, pincode, setPincode, onMapClick: handleMapClick, mapLoading }} />}
              {step === 4 && <StepBank {...{ accountNumber, setAccountNumber, confirmAccount, setConfirmAccount, ifscCode, setIfscCode, ifscStatus, bankDetails, bankName, setBankName, accountHolderName, setAccountHolderName, pennyDropStatus, onPennyDrop: handlePennyDrop }} />}
              {step === 5 && <StepMedia {...{ logoUrl, setLogoUrl, bannerUrl, setBannerUrl, factoryPhotos, photoInput, setPhotoInput, onAddPhoto: addPhoto, onRemovePhoto: (i: number) => setFactoryPhotos(p => p.filter((_,idx) => idx !== i)), certifications, certInput, setCertInput, onAddCert: () => addCert(certInput), onRemoveCert: (c: string) => setCertifications(p => p.filter(x => x !== c)) }} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav */}
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
              Verify & Continue
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
