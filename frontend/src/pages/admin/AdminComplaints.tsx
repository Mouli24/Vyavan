import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AlertCircle, CheckCircle, Search, Filter, Eye, MessageSquare } from 'lucide-react'

const STATUS_FILTERS = ['all', 'PENDING', 'ESCALATED', 'ADMIN REVIEWED', 'RESOLVED', 'REJECTED']

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'PENDING':        'bg-amber-100 text-amber-700',
    'ESCALATED':      'bg-red-100 text-red-600',
    'ADMIN REVIEWED': 'bg-blue-100 text-blue-700',
    'RESOLVED':       'bg-sp-mint text-sp-success',
    'REJECTED':       'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  )
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [resolveStatus, setResolveStatus] = useState('RESOLVED')

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminComplaints({ status: statusFilter, limit: 50 })
      setComplaints(data.data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [statusFilter])

  const filtered = complaints.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  const handleResolve = async () => {
    if (!selected) return
    await api.resolveAdminComplaint(selected._id, { status: resolveStatus, adminNote })
    setSelected(null)
    setAdminNote('')
    fetchData()
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-sp-text tracking-tight">Complaints</h1>
        <p className="text-sp-muted text-sm mt-0.5">Review and resolve platform disputes</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-placeholder" />
          <input
            type="text"
            placeholder="Search complaints..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-sp-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sp-purple/15 focus:border-sp-purple transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                statusFilter === f
                  ? 'bg-sp-purple text-white shadow-sm'
                  : 'bg-white border border-sp-border text-sp-muted hover:border-sp-purple/40 hover:text-sp-text'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sp-border-light shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sp-muted">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-sp-success opacity-50" />
            <p className="font-medium text-sm">No complaints found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sp-bg/60 border-b border-sp-border-light">
                <tr>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Complaint</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden lg:table-cell">Parties</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Status</th>
                  <th className="text-right py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border-light">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-sp-bg/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-semibold text-sp-text">{c.title}</p>
                      <p className="text-xs text-sp-muted">{c.complaintId} · {c.company}</p>
                      <p className="text-xs text-sp-placeholder">{c.filingDate ?? new Date(c.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3.5 px-5 hidden md:table-cell">
                      <span className="text-xs px-2.5 py-1 bg-sp-bg rounded-full text-sp-muted font-medium">{c.category}</span>
                    </td>
                    <td className="py-3.5 px-5 hidden lg:table-cell">
                      <p className="text-xs text-sp-text">Buyer: {c.buyer?.name ?? '—'}</p>
                      <p className="text-xs text-sp-muted">Mfr: {c.manufacturer?.name ?? '—'}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex justify-end">
                        <button
                          onClick={() => { setSelected(c); setAdminNote('') }}
                          className="p-1.5 text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-white border-l border-sp-border overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-sp-text">Complaint Details</h2>
              <button onClick={() => setSelected(null)} className="text-sp-muted">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sp-text">{selected.title}</h3>
                  <p className="text-sm text-sp-muted">{selected.complaintId} · {selected.company}</p>
                </div>
              </div>

              <StatusBadge status={selected.status} />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Category', value: selected.category },
                  { label: 'Filed', value: selected.filingDate ?? new Date(selected.createdAt).toLocaleDateString() },
                  { label: 'Buyer', value: selected.buyer?.name },
                  { label: 'Manufacturer', value: selected.manufacturer?.name },
                ].map(row => (
                  <div key={row.label} className="bg-sp-bg rounded-xl p-3">
                    <p className="text-[10px] text-sp-muted uppercase tracking-wider mb-1">{row.label}</p>
                    <p className="text-sm font-medium text-sp-text">{row.value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div className="bg-sp-bg rounded-xl p-4">
                  <p className="text-xs text-sp-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Description
                  </p>
                  <p className="text-sm text-sp-text leading-relaxed">{selected.description}</p>
                </div>
              )}

              {selected.response && (
                <div className="bg-sp-mint rounded-xl p-4">
                  <p className="text-xs text-sp-success uppercase tracking-wider mb-2">Manufacturer Response</p>
                  <p className="text-sm text-sp-text">{selected.response}</p>
                </div>
              )}

              {/* Admin resolution */}
              <div className="border-t border-sp-border pt-4 space-y-3">
                <p className="text-sm font-semibold text-sp-text">Admin Resolution</p>
                <select
                  value={resolveStatus}
                  onChange={e => setResolveStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple"
                >
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ADMIN REVIEWED">Admin Reviewed (No Action)</option>
                </select>
                <textarea
                  className="w-full p-3 bg-sp-bg border border-sp-border rounded-xl text-sm resize-none focus:outline-none focus:border-sp-purple"
                  rows={3}
                  placeholder="Admin note / resolution details..."
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                />
                <button
                  onClick={handleResolve}
                  className="w-full py-3 gradient-card-purple text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all"
                >
                  Submit Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
