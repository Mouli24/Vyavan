import { useState } from 'react'
import {
  Settings, Shield, Globe, Lock, Bell, CreditCard,
  Save, Loader2, ToggleLeft, ToggleRight, Zap,
  Package, AlertTriangle, DollarSign,
} from 'lucide-react'

interface FeatureFlag { key: string; label: string; desc: string; enabled: boolean }
interface CommissionRate { category: string; rate: number }

export default function AdminSettings() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // General
  const [platformName, setPlatformName] = useState('Vyawan')
  const [adminEmail, setAdminEmail] = useState('admin@Vyawan.com')
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  // Commission rates per category
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([
    { category: 'Textiles', rate: 5 },
    { category: 'Electronics', rate: 4 },
    { category: 'Machinery', rate: 3.5 },
    { category: 'FMCG', rate: 5 },
    { category: 'Automotive', rate: 4.5 },
    { category: 'Construction', rate: 4 },
    { category: 'Default', rate: 5 },
  ])

  // Plan pricing
  const [plans, setPlans] = useState([
    { name: 'Free', price: 0, features: 'Up to 10 products, basic analytics' },
    { name: 'Pro', price: 2999, features: 'Unlimited products, priority listing, analytics' },
    { name: 'Enterprise', price: 9999, features: 'All Pro + dedicated support, custom integrations' },
  ])

  // Feature flags
  const [flags, setFlags] = useState<FeatureFlag[]>([
    { key: 'manufacturer_verification', label: 'Manufacturer Verification Required', desc: 'New manufacturers must be approved before listing products.', enabled: true },
    { key: 'buyer_verification', label: 'Buyer GST Verification', desc: 'Require GST verification for buyers placing bulk orders.', enabled: false },
    { key: 'two_fa', label: 'Admin 2FA', desc: 'Mandatory two-factor authentication for all admin accounts.', enabled: true },
    { key: 'penny_drop', label: 'Penny Drop Bank Verification', desc: 'Verify manufacturer bank accounts via ₹1 transfer.', enabled: true },
    { key: 'gst_api', label: 'Real-time GST Validation', desc: 'Validate GST numbers via government API on submission.', enabled: true },
    { key: 'negotiation', label: 'Negotiation Module', desc: 'Allow buyers and manufacturers to negotiate pricing.', enabled: true },
    { key: 'scheduled_calls', label: 'Scheduled Calls', desc: 'Allow buyers to book calls with manufacturers.', enabled: true },
    { key: 'bulk_upload', label: 'Bulk Product Upload', desc: 'Allow manufacturers to upload products via Excel.', enabled: false },
  ])

  const toggleFlag = (key: string) => setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f))
  const updateRate = (cat: string, rate: number) => setCommissionRates(prev => prev.map(r => r.category === cat ? { ...r, rate } : r))

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000) }, 1000)
  }

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-sp-text tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-sp-purple" /> Platform Settings
        </h1>
        <p className="text-sp-muted text-sm mt-0.5">Global configuration, commission rates, and feature flags</p>
      </div>

      {/* General */}
      <section className="bg-white rounded-2xl border border-sp-border-light shadow-card p-5 space-y-4">
        <h2 className="font-semibold text-sp-text text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-sp-purple" /> General Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Platform Name</label>
            <input value={platformName} onChange={e => setPlatformName(e.target.value)}
              className="w-full px-4 py-2.5 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple" />
          </div>
          <div>
            <label className="block text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Admin Notification Email</label>
            <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-sp-bg rounded-xl">
          <div>
            <p className="text-sm font-bold text-sp-text flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Maintenance Mode
            </p>
            <p className="text-xs text-sp-muted mt-0.5">Temporarily disable the platform for all users.</p>
          </div>
          <button onClick={() => setMaintenanceMode(v => !v)} className={maintenanceMode ? 'text-sp-purple' : 'text-sp-muted'}>
            {maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>
        {maintenanceMode && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
            ⚠️ Maintenance mode is ON — platform is inaccessible to users.
          </div>
        )}
      </section>

      {/* Commission Rates */}
      <section className="bg-white rounded-2xl border border-sp-border shadow-card p-6 space-y-5">
        <h2 className="font-bold text-sp-text flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-sp-purple" /> Commission Rates (per category)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {commissionRates.map(r => (
            <div key={r.category} className="flex items-center gap-3 p-3 bg-sp-bg rounded-xl">
              <span className="text-sm font-medium text-sp-text flex-1">{r.category}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={r.rate}
                  onChange={e => updateRate(r.category, Number(e.target.value))}
                  className="w-16 px-2 py-1.5 bg-white border border-sp-border rounded-lg text-sm text-center focus:outline-none focus:border-sp-purple"
                />
                <span className="text-sm text-sp-muted">%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plan Pricing */}
      <section className="bg-white rounded-2xl border border-sp-border shadow-card p-6 space-y-5">
        <h2 className="font-bold text-sp-text flex items-center gap-2">
          <Package className="w-5 h-5 text-sp-purple" /> Plan Pricing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div key={plan.name} className="p-4 bg-sp-bg rounded-xl border border-sp-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sp-text">{plan.name}</p>
                {i === 1 && <span className="text-[10px] font-bold px-2 py-0.5 bg-sp-purple text-white rounded-full">Popular</span>}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-sp-muted">₹</span>
                <input
                  type="number"
                  min={0}
                  value={plan.price}
                  onChange={e => setPlans(prev => prev.map((p, idx) => idx === i ? { ...p, price: Number(e.target.value) } : p))}
                  className="w-24 px-2 py-1 bg-white border border-sp-border rounded-lg text-lg font-bold text-sp-text focus:outline-none focus:border-sp-purple"
                />
                <span className="text-xs text-sp-muted">/mo</span>
              </div>
              <p className="text-xs text-sp-muted">{plan.features}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Flags */}
      <section className="bg-white rounded-2xl border border-sp-border shadow-card p-6 space-y-4">
        <h2 className="font-bold text-sp-text flex items-center gap-2">
          <Zap className="w-5 h-5 text-sp-purple" /> Feature Flags
        </h2>
        <div className="space-y-3">
          {flags.map(f => (
            <div key={f.key} className="flex items-center justify-between p-4 bg-sp-bg rounded-xl">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-bold text-sp-text">{f.label}</p>
                <p className="text-xs text-sp-muted mt-0.5">{f.desc}</p>
              </div>
              <button onClick={() => toggleFlag(f.key)} className={f.enabled ? 'text-sp-purple flex-shrink-0' : 'text-sp-muted flex-shrink-0'}>
                {f.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="bg-white rounded-2xl border border-sp-border shadow-card p-6 space-y-4">
        <h2 className="font-bold text-sp-text flex items-center gap-2">
          <Shield className="w-5 h-5 text-sp-purple" /> Security
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Admin Role: Super Admin', desc: 'Full access to all platform features and settings.' },
            { label: 'Admin Role: Support Admin', desc: 'Access to complaints, buyers, manufacturers. No financial data.' },
            { label: 'Admin Role: Finance Admin', desc: 'Access to payments, settlements, commission reports only.' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between p-4 bg-sp-bg rounded-xl">
              <div>
                <p className="text-sm font-bold text-sp-text">{r.label}</p>
                <p className="text-xs text-sp-muted">{r.desc}</p>
              </div>
              <button className="text-xs font-bold text-sp-purple hover:underline">Configure</button>
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center justify-end gap-4 pb-8">
        {saved && <span className="text-sm text-sp-success font-medium">✓ Settings saved</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 gradient-card-purple text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}

