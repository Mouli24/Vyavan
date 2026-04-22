import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import {
  Building2, MapPin, Shield, Award, Image, CreditCard,
  CheckCircle, ChevronRight, ChevronLeft, Upload, Clock, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const CATEGORIES = [
  'Textiles', 'Electronics', 'Machinery', 'FMCG', 'Automotive',
  'Construction', 'Chemicals', 'Agriculture', 'Pharmaceuticals',
  'Furniture', 'Leather Goods', 'Plastics', 'Metal Products', 'Paper Products'
]

const CERTIFICATIONS = [
  'ISO 9001', 'ISO 14001', 'ISO 45001', 'OEKO-TEX', 'BIS Certified',
  'CE Marking', 'FDA Approved', 'HACCP', 'GMP', 'MSME Certified',
  'Make in India', 'Zero Defect', 'Star Export House'
]

const STEPS = [
  { id: 1, label: 'Company Info', icon: Building2 },
  { id: 2, label: 'Address',     icon: MapPin },
  { id: 3, label: 'Verification',icon: Shield },
  { id: 4, label: 'Categories',  icon: Award },
  { id: 5, label: 'Media',       icon: Image },
  { id: 6, label: 'Bank Details',icon: CreditCard },
]

interface OnboardingForm {
  // Company
  yearEstablished: string
  employeeCount: string
  annualTurnover: string
  exportMarkets: string
  // Address
  street: string
  city: string
  state: string
  pincode: string
  country: string
  // Verification
  gstNumber: string
  panNumber: string
  msmeNumber: string
  cinNumber: string
  // Categories
  categories: string[]
  certifications: string[]
  // Media (URLs for demo; real app uses Cloudinary)
  logo: string
  profileBanner: string
  factoryImages: string[]
  // Bank
  accountName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  branch: string
}

const INITIAL: OnboardingForm = {
  yearEstablished: '', employeeCount: '', annualTurnover: '', exportMarkets: '',
  street: '', city: '', state: '', pincode: '', country: 'India',
  gstNumber: '', panNumber: '', msmeNumber: '', cinNumber: '',
  categories: [], certifications: [],
  logo: '', profileBanner: '', factoryImages: [],
  accountName: '', accountNumber: '', ifscCode: '', bankName: '', branch: '',
}

export default function ManufacturerOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<OnboardingForm>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState('')

  const update = (field: keyof OnboardingForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleItem = (field: 'categories' | 'certifications', item: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(x => x !== item)
        : [...prev[field], item]
    }))
  }

  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setForm(prev => ({ ...prev, factoryImages: [...prev.factoryImages, imageUrlInput.trim()] }))
      setImageUrlInput('')
    }
  }

  const handleSubmit = async () => {
    if (!gstVerified) { setError('GST details must be verified before submitting.'); return }
    if (!bankVerified) { setError('Bank account must be verified (Penny Drop) before submitting.'); return }
    
    setLoading(true)
    setError('')
    try {
      await api.onboardManufacturer({
        gstNumber: form.gstNumber,
        panNumber: form.panNumber,
        msmeNumber: form.msmeNumber,
        cinNumber: form.cinNumber,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: form.country,
        },
        yearEstablished: form.yearEstablished ? +form.yearEstablished : undefined,
        employeeCount: form.employeeCount || undefined,
        annualTurnover: form.annualTurnover || undefined,
        exportMarkets: form.exportMarkets ? form.exportMarkets.split(',').map(s => s.trim()).filter(Boolean) : [],
        categories: form.categories,
        certifications: form.certifications,
        logo: form.logo,
        profileBanner: form.profileBanner,
        factoryImages: form.factoryImages,
        bankDetails: {
          accountName: form.accountName,
          accountNumber: form.accountNumber,
          ifscCode: form.ifscCode,
          bankName: form.bankName,
          branch: form.branch,
        },
      })
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message ?? 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  // Layer 1Automated Verification States
  const [gstVerified, setGstVerified] = useState(false)
  const [verifyingGst, setVerifyingGst] = useState(false)
  const [bankVerified, setBankVerified] = useState(false)
  const [verifyingBank, setVerifyingBank] = useState(false)

  // Auto-validate GST/PAN
  useEffect(() => {
    if (form.gstNumber.length === 15 && form.panNumber.length === 10) {
      const timer = setTimeout(async () => {
        setVerifyingGst(true)
        setError('')
        try {
          const res = await api.verifyGST(form.gstNumber, form.panNumber)
          if (res.success) {
            setGstVerified(true)
            // Optionally update legal name from API if we want to be strict
            update('accountName', res.legalName)
          }
        } catch (e: any) {
          setGstVerified(false)
          setError(e.message || 'GST/PAN verification failed.')
        } finally {
          setVerifyingGst(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setGstVerified(false)
    }
  }, [form.gstNumber, form.panNumber])

  // Penny Drop Verification
  const runPennyDrop = async () => {
    if (!form.accountNumber || !form.ifscCode || !form.accountName) {
      setError('Please fill all bank details for verification.')
      return
    }
    setVerifyingBank(true)
    setError('')
    try {
      const res = await api.verifyBank({
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode,
        accountName: form.accountName
      })
      if (res.success) {
        setBankVerified(true)
      }
    } catch (e: any) {
      setError(e.message || 'Penny Drop verification failed.')
      setBankVerified(false)
    } finally {
      setVerifyingBank(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full border border-mfr-border shadow-card text-center">
          <div className="w-16 h-16 bg-mfr-peach rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-mfr-brown" />
          </div>
          <h2 className="text-2xl font-bold text-mfr-dark mb-2">Application Submitted!</h2>
          <p className="text-mfr-muted mb-6 leading-relaxed">
            Thank you, <strong>{user?.name}</strong>! Your manufacturer application is under review.
            Our admin team will verify your documents and approve your account within 1–3 business days.
          </p>
          <div className="flex items-center gap-2 bg-sp-peach rounded-xl p-4 mb-6 text-left">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              You'll receive a notification once your account is approved.
            </p>
          </div>
          <button
            onClick={() => navigate('/manufacturer/overview')}
            className="w-full py-3 bg-mfr-brown hover:bg-mfr-brown-hover text-white font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-hero py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mfr-dark">Complete Your Business Profile</h1>
          <p className="text-mfr-muted mt-2">Set up your manufacturer profile to start receiving orders</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  step === s.id
                    ? 'bg-mfr-brown text-white'
                    : step > s.id
                    ? 'bg-mfr-peach text-mfr-brown cursor-pointer'
                    : 'bg-white text-mfr-muted border border-mfr-border cursor-not-allowed'
                }`}
              >
                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`h-px w-4 ${step > s.id ? 'bg-mfr-brown' : 'bg-sp-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-mfr-border shadow-card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 1 — Company Info */}
          {step === 1 && (
            <div className="space-y-5">
              <StepHeader icon={<Building2 className="w-5 h-5 text-mfr-brown" />} title="Company Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Year Established" required>
                  <input type="number" placeholder="2010" className={inputCls}
                    value={form.yearEstablished} onChange={e => update('yearEstablished', e.target.value)} />
                </FormField>
                <FormField label="Number of Employees">
                  <select className={inputCls} value={form.employeeCount} onChange={e => update('employeeCount', e.target.value)}>
                    <option value="">Select range</option>
                    {['1-10','11-50','51-200','201-500','500+'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </FormField>
                <FormField label="Annual Turnover">
                  <select className={inputCls} value={form.annualTurnover} onChange={e => update('annualTurnover', e.target.value)}>
                    <option value="">Select range</option>
                    {['< ₹1 Cr','₹1-5 Cr','₹5-25 Cr','₹25-100 Cr','₹100+ Cr'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </FormField>
                <FormField label="Export Markets (optional)">
                  <input type="text" placeholder="USA, UAE, UK (comma separated)" className={inputCls}
                    value={form.exportMarkets} onChange={e => update('exportMarkets', e.target.value)} />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2 — Address */}
          {step === 2 && (
            <div className="space-y-5">
              <StepHeader icon={<MapPin className="w-5 h-5 text-mfr-brown" />} title="Factory / Business Address" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Street Address" className="sm:col-span-2">
                  <input type="text" placeholder="Street, Building, Area" className={inputCls}
                    value={form.street} onChange={e => update('street', e.target.value)} />
                </FormField>
                <FormField label="City" required>
                  <input type="text" placeholder="Mumbai" className={inputCls}
                    value={form.city} onChange={e => update('city', e.target.value)} />
                </FormField>
                <FormField label="State" required>
                  <input type="text" placeholder="Maharashtra" className={inputCls}
                    value={form.state} onChange={e => update('state', e.target.value)} />
                </FormField>
                <FormField label="PIN Code" required>
                  <input type="text" placeholder="400001" className={inputCls}
                    value={form.pincode} onChange={e => update('pincode', e.target.value)} />
                </FormField>
                <FormField label="Country">
                  <input type="text" placeholder="India" className={inputCls}
                    value={form.country} onChange={e => update('country', e.target.value)} />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 3 — Verification */}
          {step === 3 && (
            <div className="space-y-5">
              <StepHeader icon={<Shield className="w-5 h-5 text-mfr-brown" />} title="Business Verification Documents" />
              <div className="p-3 bg-mfr-brown-pale rounded-xl text-xs text-mfr-brown border border-mfr-border/20 flex justify-between items-center">
                <span>These details will be verified automatically.</span>
                {verifyingGst && <Loader2 className="w-4 h-4 animate-spin" />}
                {gstVerified && <Badge className="bg-emerald-500 text-white border-none">Verified ✓</Badge>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="GST Number" required>
                  <input type="text" placeholder="29ABCDE1234F1Z5" className={inputCls}
                    value={form.gstNumber} onChange={e => update('gstNumber', e.target.value.toUpperCase())}
                    maxLength={15} />
                </FormField>
                <FormField label="PAN Number" required>
                  <input type="text" placeholder="ABCDE1234F" className={inputCls}
                    value={form.panNumber} onChange={e => update('panNumber', e.target.value.toUpperCase())}
                    maxLength={10} />
                </FormField>
                {/* ... existing fields ... */}
                <FormField label="MSME Number (optional)">
                  <input type="text" placeholder="MSME-XXXXXXXX" className={inputCls}
                    value={form.msmeNumber} onChange={e => update('msmeNumber', e.target.value)} />
                </FormField>
                <FormField label="CIN Number (optional)">
                  <input type="text" placeholder="L17110MH1973PLC019786" className={inputCls}
                    value={form.cinNumber} onChange={e => update('cinNumber', e.target.value)} />
                </FormField>
              </div>
            </div>
          )}

          {/* ... Categories and Media Steps ... */}
          {step === 4 && (
            <div className="space-y-6">
              <StepHeader icon={<Award className="w-5 h-5 text-mfr-brown" />} title="Product Categories & Certifications" />

              <div>
                <p className="text-sm font-semibold text-mfr-dark mb-3">
                  Product Categories <span className="text-red-500">*</span>
                  <span className="text-xs text-mfr-muted font-normal ml-2">({form.categories.length} selected)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleItem('categories', cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        form.categories.includes(cat)
                          ? 'bg-mfr-brown text-white border-mfr-border'
                          : 'bg-mfr-bg text-mfr-muted border-mfr-border hover:border-mfr-border/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-mfr-dark mb-3">
                  Certifications
                  <span className="text-xs text-mfr-muted font-normal ml-2">({form.certifications.length} selected)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map(cert => (
                    <button
                      key={cert}
                      onClick={() => toggleItem('certifications', cert)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        form.certifications.includes(cert)
                          ? 'bg-mfr-peach text-mfr-brown border-mfr-border'
                          : 'bg-mfr-bg text-mfr-muted border-mfr-border hover:border-mfr-border'
                      }`}
                    >
                      {cert}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <StepHeader icon={<Image className="w-5 h-5 text-mfr-brown" />} title="Company Media & Images" />
              <p className="text-xs text-mfr-muted">Add image URLs for your factory and company visuals. In production, these would be uploaded to cloud storage.</p>

              <FormField label="Company Logo URL">
                <input type="url" placeholder="https://..." className={inputCls}
                  value={form.logo} onChange={e => update('logo', e.target.value)} />
              </FormField>
              <FormField label="Profile Banner URL">
                <input type="url" placeholder="https://..." className={inputCls}
                  value={form.profileBanner} onChange={e => update('profileBanner', e.target.value)} />
              </FormField>

              <div>
                <label className="block text-sm font-medium text-mfr-dark mb-2">
                  Factory Images ({form.factoryImages.length} added)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    placeholder="Paste image URL..."
                    className={`${inputCls} flex-1`}
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addImageUrl()}
                  />
                  <button
                    onClick={addImageUrl}
                    className="px-4 py-2.5 bg-mfr-brown hover:bg-mfr-brown-hover text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Add
                  </button>
                </div>
                {form.factoryImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.factoryImages.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-mfr-border"
                          onError={e => (e.currentTarget.src = 'https://placehold.co/80x80/FCE7D6/6B4E3D?text=IMG')} />
                        <button
                          onClick={() => setForm(prev => ({ ...prev, factoryImages: prev.factoryImages.filter((_, i) => i !== idx) }))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6 — Bank Details */}
          {step === 6 && (
            <div className="space-y-5">
              <StepHeader icon={<CreditCard className="w-5 h-5 text-mfr-brown" />} title="Bank Account Details" />
              <div className="p-4 bg-sp-peach rounded-xl text-xs text-amber-900 border border-sp-peach-border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bankVerified ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-600'}`}>
                    {bankVerified ? <CheckCircle size={16} /> : <CreditCard size={16} />}
                  </div>
                  <span>{bankVerified ? 'Penny Drop Verified ✓' : 'Verification required to receive payments.'}</span>
                </div>
                {!bankVerified && (
                  <Button
                    onClick={runPennyDrop}
                    disabled={verifyingBank}
                    className="h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  >
                    {verifyingBank ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                    Initiate Penny Drop
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Account Holder Name" required>
                  <input type="text" placeholder="Legal business name" className={inputCls}
                    value={form.accountName} onChange={e => update('accountName', e.target.value)} />
                </FormField>
                <FormField label="Account Number" required>
                  <input type="text" placeholder="XXXXXXXXXXXX" className={inputCls}
                    value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} />
                </FormField>
                <FormField label="IFSC Code" required>
                  <input type="text" placeholder="SBIN0001234" className={inputCls}
                    value={form.ifscCode} onChange={e => update('ifscCode', e.target.value.toUpperCase())} />
                </FormField>
                <FormField label="Bank Name" required>
                  <input type="text" placeholder="State Bank of India" className={inputCls}
                    value={form.bankName} onChange={e => update('bankName', e.target.value)} />
                </FormField>
                <FormField label="Branch (optional)" className="sm:col-span-2">
                  <input type="text" placeholder="Andheri East, Mumbai" className={inputCls}
                    value={form.branch} onChange={e => update('branch', e.target.value)} />
                </FormField>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-mfr-border">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/manufacturer/overview')}
              className="flex items-center gap-2 px-5 py-2.5 bg-mfr-bg border border-mfr-border text-mfr-muted font-medium rounded-xl text-sm hover:bg-sp-border transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'Skip for now' : 'Previous'}
            </button>

            {step < STEPS.length ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-mfr-brown hover:bg-mfr-brown-hover text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-mfr-brown hover:bg-mfr-brown-hover text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {loading ? 'Submitting...' : 'Submit for Review'}
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Skip link */}
        <p className="text-center text-sm text-mfr-muted mt-4">
          <button onClick={() => navigate('/manufacturer/overview')} className="hover:text-mfr-brown transition-colors">
            Complete later from dashboard →
          </button>
        </p>
      </div>
    </div>
  )
}

// ── Helpers ──
const inputCls = 'w-full px-4 py-3 bg-mfr-bg border border-mfr-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mfr-brown/20 focus:border-mfr-border transition-all'

function StepHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-9 h-9 bg-mfr-brown-pale rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-mfr-dark">{title}</h2>
    </div>
  )
}

function FormField({
  label, required, className = '', children
}: {
  label: string; required?: boolean; className?: string; children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-mfr-dark mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}


