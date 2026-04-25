import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import {
  ClipboardCheck, CheckCircle, XCircle, Eye, Search,
  Shield, FileText, MapPin, Building2, Users,
  AlertCircle, ChevronDown, Download, RefreshCw, Clock
} from 'lucide-react'

type Tab = 'manufacturers' | 'buyers'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved:  'bg-emerald-100 text-emerald-700',
    pending:   'bg-amber-100 text-amber-700',
    rejected:  'bg-rose-100 text-rose-700',
    suspended: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

function SLATimer({ createdAt }: { createdAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, isBreached: boolean}>({ h: 48, m: 0, isBreached: false })

  useEffect(() => {
    const calculateTime = () => {
      const created = new Date(createdAt).getTime()
      const now = new Date().getTime()
      const diff = now - created
      const hoursRemaining = 48 - (diff / (1000 * 60 * 60))
      
      if (hoursRemaining <= 0) {
        setTimeLeft({ h: 0, m: 0, isBreached: true })
      } else {
        const h = Math.floor(hoursRemaining)
        const m = Math.floor((hoursRemaining - h) * 60)
        setTimeLeft({ h, m, isBreached: false })
      }
    }
    calculateTime()
    const timer = setInterval(calculateTime, 60000)
    return () => clearInterval(timer)
  }, [createdAt])

  if (timeLeft.isBreached) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-200">
        <AlertCircle size={12} /> SLA Breached
      </span>
    )
  }

  const isWarning = timeLeft.h < 12
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${isWarning ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
      <Clock size={12} /> {timeLeft.h}h {timeLeft.m}m left
    </span>
  )
}

export default function AdminVerification() {
  const [tab, setTab] = useState<Tab>('manufacturers')
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [requestDocsNote, setRequestDocsNote] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mfrData, buyerData] = await Promise.all([
        api.getAdminManufacturers({ status: 'pending', limit: 100 }),
        api.getAdminBuyers({ page: 1 }),
      ])
      setManufacturers(mfrData.data ?? [])
      setBuyers(buyerData.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)

  const handleApprove = async (id: string) => {
    setActionLoading(true)
    try {
      const res = await api.approveManufacturer(id)
      setManufacturers(prev => prev.filter(m => m._id !== id))
      setSuccessData(res)
      setShowSuccessModal(true)
      setSelected(null)
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await api.rejectManufacturer(selected._id, rejectReason)
      setManufacturers(prev => prev.filter(m => m._id !== selected._id))
      setShowRejectModal(false)
      setSelected(null)
      setRejectReason('')
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  const handleRequestDocs = async () => {
    if (!selected || !requestDocsNote.trim()) return
    setActionLoading(true)
    try {
      await api.requestMoreDocs(selected._id, requestDocsNote)
      setShowRequestModal(false)
      setRequestDocsNote('')
      // Refresh to show any updated notes in UI
      fetchData()
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  const filteredMfr = manufacturers.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.company?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredBuyers = buyers.filter(b =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.company?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-sp-text tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-sp-purple" /> Verification Queue
          </h1>
          <p className="text-sp-muted text-sm mt-0.5">Review submitted documents and approve/reject accounts</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-sp-border rounded-xl text-sm font-medium text-sp-muted hover:text-sp-purple transition-all shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-sp-border">
        {(['manufacturers', 'buyers'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
              tab === t ? 'border-sp-purple text-sp-purple' : 'border-transparent text-sp-muted hover:text-sp-text'
            }`}
          >
            {t === 'manufacturers' ? `Manufacturers (${filteredMfr.length})` : `Buyers (${filteredBuyers.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-placeholder" />
        <input
          type="text"
          placeholder={`Search ${tab}...`}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-sp-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sp-purple/20 focus:border-sp-purple"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-sp-border-light shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'manufacturers' ? (
          filteredMfr.length === 0 ? (
            <div className="text-center py-16 text-sp-muted">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-sp-success opacity-50" />
              <p className="font-medium text-sm">No pending manufacturer verifications</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredMfr.map(m => (
                <div key={m._id} className="bg-white border-2 border-sp-border-light rounded-[32px] p-6 hover:border-sp-purple/20 hover:shadow-xl transition-all group flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-sp-purple-pale rounded-2xl flex items-center justify-center text-sp-purple text-xl font-bold border border-sp-purple/10">
                        {m.name?.[0]}
                      </div>
                      <div className="max-w-[150px]">
                        <h3 className="font-bold text-sp-text truncate">{m.name}</h3>
                        <p className="text-xs text-sp-muted italic truncate">{m.company}</p>
                        <p className="text-[10px] text-sp-placeholder mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <SLATimer createdAt={m.createdAt} />
                  </div>

                  {/* Document Checklist */}
                  <div className="space-y-3 mb-8">
                     <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest px-1">Document Checklist</p>
                     <div className="grid grid-cols-2 gap-2">
                        <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${m.profile?.gstNumber ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                           <Shield size={14} className={m.profile?.gstNumber ? 'text-emerald-500' : ''} />
                           <span className="text-[10px] font-bold">GST Cert.</span>
                           {m.profile?.gstNumber && <CheckCircle size={12} className="ml-auto text-emerald-500" />}
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${m.profile?.panNumber ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                           <Building2 size={14} className={m.profile?.panNumber ? 'text-emerald-500' : ''} />
                           <span className="text-[10px] font-bold">PAN Card</span>
                           {m.profile?.panNumber && <CheckCircle size={12} className="ml-auto text-emerald-500" />}
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${m.profile?.factoryImages?.length ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                           <Search size={14} className={m.profile?.factoryImages?.length ? 'text-emerald-500' : ''} />
                           <span className="text-[10px] font-bold">Factory Photos</span>
                           {m.profile?.factoryImages?.length && <CheckCircle size={12} className="ml-auto text-emerald-500" />}
                        </div>
                        <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${m.profile?.bizDocUrl ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                           <FileText size={14} className={m.profile?.bizDocUrl ? 'text-emerald-500' : ''} />
                           <span className="text-[10px] font-bold">Biz Reg.</span>
                           {m.profile?.bizDocUrl && <CheckCircle size={12} className="ml-auto text-emerald-500" />}
                        </div>
                     </div>
                  </div>

                  {/* GST Validation Status */}
                  {m.profile?.gstNumber && (
                     <div className="mb-8 p-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                              <Shield size={12} />
                           </div>
                           <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">GST Legal Check</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle size={12} /> VALIDATED</span>
                     </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto space-y-3">
                    <button 
                      onClick={() => setSelected(m)}
                      className="w-full py-3 bg-sp-bg border border-sp-border text-sp-text text-sm font-bold rounded-2xl hover:bg-sp-purple-pale hover:text-sp-purple hover:border-sp-purple/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={16} /> View Details
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(m._id)}
                        className="flex-1 py-3 bg-emerald-600 text-white text-xs font-black rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-emerald-100"
                      >
                        APPROVE
                      </button>
                      <button 
                        onClick={() => { setSelected(m); setShowRejectModal(true) }}
                        className="flex-1 py-3 bg-white border border-red-100 text-red-600 text-xs font-black rounded-2xl hover:bg-red-50 transition-all"
                      >
                        REJECT
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredBuyers.length === 0 ? (
            <div className="text-center py-16 text-sp-muted">
              <Users className="w-10 h-10 mx-auto mb-3 text-sp-border" />
              <p className="font-medium text-sm">No buyers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sp-bg/60 border-b border-sp-border-light">
                  <tr>
                    <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Buyer</th>
                    <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden md:table-cell">Business Type</th>
                    <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden lg:table-cell">Location</th>
                    <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Joined</th>
                    <th className="text-right py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sp-border-light">
                  {filteredBuyers.map(b => (
                    <tr key={b._id} className="hover:bg-sp-bg/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-sp-sky rounded-full flex items-center justify-center text-sp-info font-semibold text-sm flex-shrink-0">
                            {b.name?.[0] ?? 'B'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-sp-text">{b.name}</p>
                            <p className="text-xs text-sp-muted">{b.company ?? 'Individual'}</p>
                            <p className="text-xs text-sp-placeholder">{b.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 hidden md:table-cell">
                        <span className="text-xs px-2.5 py-1 bg-sp-bg rounded-full text-sp-muted font-medium">
                          {b.businessType ?? 'Not specified'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 hidden lg:table-cell">
                        <p className="text-xs text-sp-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {b.location ?? '—'}
                        </p>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-xs text-sp-muted">{new Date(b.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setSelected(b)} className="p-1.5 text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-sp-success hover:bg-sp-mint rounded-lg transition-all">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Detail Panel */}
      {selected && !showRejectModal && !showRequestModal && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-white border-l border-sp-border overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-sp-text">Verification Details</h2>
              <button onClick={() => setSelected(null)} className="text-sp-muted hover:text-sp-text">✕</button>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sp-purple-pale rounded-2xl flex items-center justify-center text-sp-purple text-xl font-bold">
                  {selected.name?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-sp-text">{selected.name}</h3>
                  <p className="text-sm text-sp-muted">{selected.company}</p>
                  <p className="text-xs text-sp-placeholder">{selected.email}</p>
                </div>
              </div>

              <StatusBadge status={selected.manufacturerStatus ?? 'pending'} />

                {selected.profile?.verificationNote && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Previous Admin Note</p>
                  <p className="text-xs text-amber-800 italic">"{selected.profile.verificationNote}"</p>
                </div>
              )}

              {/* Mock GST Validation Service */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                 <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                       <Shield size={14} className="text-emerald-500" /> GST API Check (Mock)
                    </p>
                 </div>
                 {selected.profile?.gstNumber ? (
                    <div className="space-y-3">
                       <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-500">Provided GST</span>
                          <span className="text-xs font-black text-slate-800">{selected.profile.gstNumber}</span>
                       </div>
                       <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
                          <span className="text-xs font-bold text-slate-500">API Status</span>
                          <span className="text-xs font-black text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> ACTIVE</span>
                       </div>
                       <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
                          <span className="text-xs font-bold text-slate-500">Legal Name Match</span>
                          <span className="text-xs font-black text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> MATCHED</span>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center py-4 bg-white rounded-xl border border-rose-100">
                       <AlertCircle size={20} className="text-rose-400 mx-auto mb-2" />
                       <p className="text-xs font-bold text-rose-500">No GST Number Provided</p>
                    </div>
                 )}
              </div>

              {/* Documents */}
              <div>
                <p className="text-xs font-bold text-sp-muted uppercase tracking-wider mb-3">Submitted Documents</p>
                <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'GST Number', value: selected.profile?.gstNumber },
                      { label: 'PAN Number', value: selected.profile?.panNumber },
                      { label: 'Udyam Registration', value: selected.profile?.udyamNumber },
                      { label: 'MSME', value: selected.profile?.msmeNumber },
                      { label: 'CIN', value: selected.profile?.cinNumber },
                      { label: 'Location', value: selected.location },
                      { label: 'Coordinates', value: selected.profile?.geoLocation ? `${selected.profile.geoLocation.lat}, ${selected.profile.geoLocation.lng}` : null },
                      { label: 'Year Est.', value: selected.profile?.yearEstablished },
                      { label: 'Employees', value: selected.profile?.employeeCount },
                      { label: 'Turnover', value: selected.profile?.annualTurnover },
                    ].map(row => (
                      <div key={row.label} className="bg-sp-bg rounded-xl p-3">
                        <p className="text-[10px] text-sp-muted uppercase tracking-wider mb-1">{row.label}</p>
                        <p className={`text-sm font-medium ${row.value ? 'text-sp-text' : 'text-sp-placeholder'}`}>
                          {row.value ?? 'Not provided'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New: Contact Person & Capacity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Contact Person</p>
                    <div className="bg-sp-bg rounded-xl p-3 space-y-1">
                      <p className="text-sm font-bold text-sp-text">{selected.profile?.contactPerson?.name ?? '—'}</p>
                      <p className="text-[11px] text-sp-muted">{selected.profile?.contactPerson?.designation ?? '—'}</p>
                      <p className="text-[11px] text-sp-purple font-medium">{selected.profile?.contactPerson?.phone ?? '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Production Cap.</p>
                    <div className="bg-sp-bg rounded-xl p-3">
                      <p className="text-sm font-bold text-sp-text">
                        {selected.profile?.factoryCapacity?.units?.toLocaleString() ?? '—'}
                      </p>
                      <p className="text-[11px] text-sp-muted uppercase tracking-tight">
                        per {selected.profile?.factoryCapacity?.period ?? 'month'}
                      </p>
                    </div>
                  </div>
                </div>

              {/* Bank details */}
              {selected.profile?.bankDetails && (
                <div>
                  <p className="text-xs font-bold text-sp-muted uppercase tracking-wider mb-3">Bank Details</p>
                  <div className="bg-sp-bg rounded-xl p-4 space-y-2">
                    <p className="text-sm text-sp-text"><span className="text-sp-muted">Account:</span> {selected.profile.bankDetails.accountNumber ?? '—'}</p>
                    <p className="text-sm text-sp-text"><span className="text-sp-muted">IFSC:</span> {selected.profile.bankDetails.ifscCode ?? '—'}</p>
                    <p className="text-sm text-sp-text"><span className="text-sp-muted">Bank:</span> {selected.profile.bankDetails.bankName ?? '—'}</p>
                  </div>
                </div>
              )}

              {/* Categories */}
              {selected.profile?.categories?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.profile.categories.map((c: string) => (
                      <span key={c} className="px-2 py-1 bg-sp-purple-pale text-sp-purple text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {selected.profile?.certifications?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.profile.certifications.map((c: string) => (
                      <span key={c} className="px-2 py-1 bg-sp-mint text-sp-success text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certification Documents */}
              {selected.profile?.certificationDocs?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Certification Links</p>
                  <div className="space-y-2">
                    {selected.profile.certificationDocs.map((doc: any, i: number) => (
                      <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-sp-bg border border-sp-border rounded-xl text-xs text-sp-purple hover:bg-sp-purple-pale transition-all">
                        <Award className="w-4 h-4" />
                        {doc.name || 'View Document'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Factory Images */}
              {selected.profile?.factoryImages?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-sp-muted uppercase tracking-wider mb-3">Factory Photos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.profile.factoryImages.map((img: string, i: number) => (
                      <div key={i} className="aspect-video bg-sp-bg rounded-xl overflow-hidden border border-sp-border group relative">
                        <img src={img} alt="Factory" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <a href={img} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleApprove(selected._id)}
                  disabled={actionLoading}
                  className="flex-1 py-3 gradient-card-purple text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  ✓ Approve & Verify
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl text-sm border border-red-200 hover:bg-red-100 transition-all"
                >
                  ✕ Reject
                </button>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full py-3 bg-amber-50 text-amber-700 font-bold rounded-xl text-sm border border-amber-200 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> Request More Documents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-sp-text">Reject Verification</h3>
            </div>
            <p className="text-sm text-sp-muted mb-4">Rejecting <strong>{selected.name}</strong>. Provide a reason:</p>
            <textarea
              className="w-full p-3 bg-sp-bg border border-sp-border rounded-xl text-sm resize-none focus:outline-none focus:border-sp-purple"
              rows={3}
              placeholder="e.g. GST number invalid, documents unclear..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 bg-sp-bg border border-sp-border text-sp-muted font-medium rounded-xl text-sm">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-60">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request More Docs Modal */}
      {showRequestModal && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-sp-text">Request More Documents</h3>
            </div>
            <p className="text-sm text-sp-muted mb-4">Specify what additional documents are needed from <strong>{selected.name}</strong>:</p>
            <textarea
              className="w-full p-3 bg-sp-bg border border-sp-border rounded-xl text-sm resize-none focus:outline-none focus:border-sp-purple"
              rows={3}
              placeholder="e.g. Please upload a clearer GST certificate and factory photos..."
              value={requestDocsNote}
              onChange={e => setRequestDocsNote(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRequestModal(false)} className="flex-1 py-3 bg-sp-bg border border-sp-border text-sp-muted font-medium rounded-xl text-sm">Cancel</button>
              <button
                onClick={handleRequestDocs}
                disabled={!requestDocsNote.trim() || actionLoading}
                className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-60"
              >
                {actionLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowSuccessModal(false)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl text-center border border-sp-border">
            <div className="w-20 h-20 bg-sp-mint rounded-3xl mx-auto mb-6 flex items-center justify-center text-sp-success shadow-lg shadow-sp-success/10">
               <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-sp-text mb-2 tracking-tight">Approved Successfully!</h3>
            <p className="text-sm text-sp-muted mb-8 font-medium">The manufacturer <b>{successData.user?.name}</b> is now verified. Please share these codes with them:</p>
            
            <div className="space-y-4 mb-10">
               <div className="p-5 bg-sp-bg rounded-2xl border border-sp-border flex flex-col items-center">
                  <span className="text-[10px] font-black text-sp-muted uppercase tracking-widest mb-1">Company Store ID</span>
                  <span className="text-2xl font-black text-sp-purple tracking-wider font-mono">{successData.companyCode}</span>
               </div>
               <div className="p-5 bg-sp-bg rounded-2xl border border-sp-border flex flex-col items-center">
                  <span className="text-[10px] font-black text-sp-muted uppercase tracking-widest mb-1">Activation Code</span>
                  <span className="text-2xl font-black text-sp-text tracking-[0.25em] font-mono">{successData.activationCode}</span>
               </div>
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-4 bg-sp-text text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-sp-text/10 uppercase tracking-widest text-xs"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
