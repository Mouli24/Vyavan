import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Factory, CheckCircle, XCircle, Eye, Search,
  MapPin, Calendar, AlertCircle, Shield, Filter
} from 'lucide-react'

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Suspended', value: 'suspended' },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-sp-mint text-sp-success',
    pending:  'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-600',
    suspended:'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export default function AdminManufacturers() {
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminManufacturers({ status: statusFilter, limit: 50 })
      setManufacturers(data.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [statusFilter])

  const filtered = manufacturers.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.company?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleApprove = async (id: string) => {
    await api.approveManufacturer(id)
    fetchData()
  }

  const handleReject = async () => {
    if (!selected) return
    await api.rejectManufacturer(selected._id, rejectReason)
    setShowRejectModal(false)
    setSelected(null)
    setRejectReason('')
    fetchData()
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-sp-text tracking-tight">Manufacturers</h1>
        <p className="text-sp-muted text-sm mt-0.5">Review, approve, and manage manufacturer accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-placeholder" />
          <input
            type="text"
            placeholder="Search by name, company, email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-sp-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sp-purple/15 focus:border-sp-purple transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                statusFilter === f.value
                  ? 'bg-sp-purple text-white shadow-sm'
                  : 'bg-white border border-sp-border text-sp-muted hover:border-sp-purple/40 hover:text-sp-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-sp-border-light shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sp-muted">
            <Factory className="w-10 h-10 mx-auto mb-3 text-sp-border" />
            <p className="font-medium text-sm">No manufacturers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sp-bg/60 border-b border-sp-border-light">
                <tr>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Manufacturer</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden lg:table-cell">Registered</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">GST / Profile</th>
                  <th className="text-right py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border-light">
                {filtered.map((m) => (
                  <tr key={m._id} className="hover:bg-sp-bg/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sp-purple-pale rounded-full flex items-center justify-center text-sp-purple font-semibold text-sm flex-shrink-0">
                          {m.name?.[0] ?? 'M'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-sp-text">{m.name}</p>
                          <p className="text-xs text-sp-muted">{m.company}</p>
                          <p className="text-xs text-sp-placeholder">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-sp-muted">
                        <MapPin className="w-3 h-3" />
                        {m.location ?? '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-sp-muted">
                        <Calendar className="w-3 h-3" />
                        {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={m.manufacturerStatus ?? 'pending'} />
                    </td>
                    <td className="py-3.5 px-5">
                      {m.profile?.gstNumber ? (
                        <span className="flex items-center gap-1 text-xs text-sp-success font-medium">
                          <Shield className="w-3 h-3" />
                          {m.profile.gstNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-sp-placeholder">Not submitted</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelected(m)}
                          className="p-1.5 text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(m.manufacturerStatus === 'pending' || m.manufacturerStatus === 'rejected') && (
                          <button
                            onClick={() => handleApprove(m._id)}
                            className="p-1.5 text-sp-success hover:bg-sp-mint rounded-lg transition-all"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {m.manufacturerStatus !== 'rejected' && (
                          <button
                            onClick={() => { setSelected(m); setShowRejectModal(true) }}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Side Panel */}
      {selected && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-white border-l border-sp-border overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-sp-text">Manufacturer Details</h2>
              <button onClick={() => setSelected(null)} className="text-sp-muted hover:text-sp-text">✕</button>
            </div>

            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'GST', value: selected.profile?.gstNumber },
                  { label: 'PAN', value: selected.profile?.panNumber },
                  { label: 'MSME', value: selected.profile?.msmeNumber },
                  { label: 'Location', value: selected.location },
                  { label: 'Categories', value: selected.profile?.categories?.join(', ') },
                  { label: 'Year Est.', value: selected.profile?.yearEstablished },
                  { label: 'Employees', value: selected.profile?.employeeCount },
                  { label: 'Registered', value: new Date(selected.createdAt).toLocaleDateString() },
                ].map(row => (
                  <div key={row.label} className="bg-sp-bg rounded-xl p-3">
                    <p className="text-[10px] text-sp-muted uppercase tracking-wider mb-1">{row.label}</p>
                    <p className="text-sm font-medium text-sp-text">{row.value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {selected.profile?.certifications?.length > 0 && (
                <div>
                  <p className="text-xs text-sp-muted uppercase tracking-wider mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.profile.certifications.map((c: string) => (
                      <span key={c} className="px-2 py-1 bg-sp-mint text-sp-success text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {selected.manufacturerStatus !== 'approved' && (
                  <button
                    onClick={() => { handleApprove(selected._id); setSelected(null) }}
                    className="flex-1 py-3 gradient-card-purple text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all"
                  >
                    ✓ Approve
                  </button>
                )}
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl text-sm border border-red-200 hover:bg-red-100 transition-all"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-bold text-sp-text">Reject Manufacturer</h3>
            </div>
            <p className="text-sm text-sp-muted mb-4">
              Rejecting <strong>{selected.name}</strong> ({selected.company}). Please provide a reason:
            </p>
            <textarea
              className="w-full p-3 bg-sp-bg border border-sp-border rounded-xl text-sm resize-none focus:outline-none focus:border-sp-purple"
              rows={3}
              placeholder="Rejection reason (sent to manufacturer)..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-sp-bg border border-sp-border text-sp-muted font-medium rounded-xl text-sm hover:bg-sp-border transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
