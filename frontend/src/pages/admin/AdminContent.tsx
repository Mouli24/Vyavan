import { useState } from 'react'
import {
  Megaphone, Image, Star, FileText, Bell,
  CheckCircle, XCircle, Plus, Trash2, Edit3,
  Send, Eye, ToggleLeft, ToggleRight,
} from 'lucide-react'

type ContentTab = 'banners' | 'featured' | 'announcements' | 'broadcast'

const MOCK_BANNERS = [
  { id: '1', company: 'Sharma Textiles', type: 'Paid', status: 'pending', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=100&fit=crop' },
  { id: '2', company: 'Delhi Electronics', type: 'Organic', status: 'approved', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=100&fit=crop' },
  { id: '3', company: 'Mumbai Machinery', type: 'Paid', status: 'pending', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=100&fit=crop' },
]

const MOCK_FEATURED = [
  { id: '1', company: 'Sharma Textiles', slot: 1, type: 'Paid', active: true },
  { id: '2', company: 'Pune Ceramics', slot: 2, type: 'Organic', active: true },
  { id: '3', company: 'Delhi Electronics', slot: 3, type: 'Paid', active: false },
]

export default function AdminContent() {
  const [tab, setTab] = useState<ContentTab>('banners')
  const [banners, setBanners] = useState(MOCK_BANNERS)
  const [featured, setFeatured] = useState(MOCK_FEATURED)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('all')
  const [announcements, setAnnouncements] = useState([
    { id: '1', title: 'Platform Maintenance', body: 'Scheduled maintenance on Sunday 2-4 AM IST.', published: true, date: '2024-01-15' },
    { id: '2', title: 'New Feature: Bulk Upload', body: 'Manufacturers can now upload products in bulk via Excel.', published: false, date: '2024-01-18' },
  ])
  const [newAnnTitle, setNewAnnTitle] = useState('')
  const [newAnnBody, setNewAnnBody] = useState('')

  const approveBanner = (id: string) => setBanners(prev => prev.map(b => b.id === id ? { ...b, status: 'approved' } : b))
  const rejectBanner = (id: string) => setBanners(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b))
  const toggleFeatured = (id: string) => setFeatured(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f))
  const toggleAnnouncement = (id: string) => setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, published: !a.published } : a))
  const addAnnouncement = () => {
    if (!newAnnTitle.trim()) return
    setAnnouncements(prev => [...prev, { id: Date.now().toString(), title: newAnnTitle, body: newAnnBody, published: false, date: new Date().toISOString().slice(0, 10) }])
    setNewAnnTitle(''); setNewAnnBody('')
  }

  const TABS: { key: ContentTab; label: string; icon: any }[] = [
    { key: 'banners', label: 'Company Banners', icon: Image },
    { key: 'featured', label: 'Featured Slots', icon: Star },
    { key: 'announcements', label: 'Announcements', icon: FileText },
    { key: 'broadcast', label: 'Broadcast', icon: Bell },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-sp-purple" /> Content Management
        </h1>
        <p className="text-sp-muted text-sm mt-1">Manage banners, featured slots, announcements and broadcasts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sp-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
              tab === t.key ? 'border-sp-purple text-sp-purple' : 'border-transparent text-sp-muted hover:text-sp-text'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Banners ── */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <p className="text-sm text-sp-muted">Review and approve/reject company banner submissions.</p>
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-sp-border shadow-card p-5 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48 h-20 rounded-xl overflow-hidden bg-sp-bg flex-shrink-0">
                <img src={b.image} alt={b.company} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sp-text">{b.company}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.type === 'Paid' ? 'bg-sp-purple-pale text-sp-purple' : 'bg-sp-mint text-sp-success'}`}>
                      {b.type}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    b.status === 'approved' ? 'bg-sp-mint text-sp-success' :
                    b.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>{b.status}</span>
                </div>
                {b.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approveBanner(b.id)} className="flex items-center gap-1.5 px-4 py-2 bg-sp-mint text-sp-success rounded-xl text-xs font-bold hover:opacity-80 transition-all">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => rejectBanner(b.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:opacity-80 transition-all">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-sp-bg text-sp-muted rounded-xl text-xs font-bold hover:bg-sp-border transition-all">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Featured Slots ── */}
      {tab === 'featured' && (
        <div className="space-y-4">
          <p className="text-sm text-sp-muted">Manage featured manufacturer slots on the homepage.</p>
          <div className="bg-white rounded-2xl border border-sp-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-sp-bg border-b border-sp-border">
                <tr className="text-xs text-sp-muted uppercase tracking-wider">
                  <th className="text-left py-3 px-4">Slot</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Active</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border">
                {featured.map(f => (
                  <tr key={f.id} className="hover:bg-sp-bg transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-8 h-8 bg-sp-purple-pale rounded-full flex items-center justify-center text-sp-purple font-bold text-sm">
                        {f.slot}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-sp-text">{f.company}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.type === 'Paid' ? 'bg-sp-purple-pale text-sp-purple' : 'bg-sp-mint text-sp-success'}`}>
                        {f.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleFeatured(f.id)} className="text-sp-purple">
                        {f.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-sp-muted" />}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-sp-purple text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Add Featured Slot
          </button>
        </div>
      )}

      {/* ── Announcements ── */}
      {tab === 'announcements' && (
        <div className="space-y-5">
          {/* New announcement form */}
          <div className="bg-white rounded-2xl border border-sp-border shadow-card p-5 space-y-3">
            <h3 className="font-bold text-sp-text">New Announcement</h3>
            <input
              type="text"
              placeholder="Title"
              className="w-full px-4 py-2.5 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple"
              value={newAnnTitle}
              onChange={e => setNewAnnTitle(e.target.value)}
            />
            <textarea
              placeholder="Announcement body..."
              rows={3}
              className="w-full px-4 py-2.5 bg-sp-bg border border-sp-border rounded-xl text-sm resize-none focus:outline-none focus:border-sp-purple"
              value={newAnnBody}
              onChange={e => setNewAnnBody(e.target.value)}
            />
            <button onClick={addAnnouncement} disabled={!newAnnTitle.trim()} className="flex items-center gap-2 px-4 py-2.5 bg-sp-purple text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all">
              <Plus className="w-4 h-4" /> Create Draft
            </button>
          </div>

          {/* Existing announcements */}
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-sp-border shadow-card p-5 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sp-text">{a.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.published ? 'bg-sp-mint text-sp-success' : 'bg-sp-bg text-sp-muted'}`}>
                      {a.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-sp-muted">{a.body}</p>
                  <p className="text-xs text-sp-placeholder mt-1">{a.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleAnnouncement(a.id)} className="text-sp-purple">
                    {a.published ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-sp-muted" />}
                  </button>
                  <button className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Broadcast ── */}
      {tab === 'broadcast' && (
        <div className="max-w-2xl space-y-5">
          <p className="text-sm text-sp-muted">Send email/notification broadcast to platform users.</p>
          <div className="bg-white rounded-2xl border border-sp-border shadow-card p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Target Audience</label>
              <select
                value={broadcastTarget}
                onChange={e => setBroadcastTarget(e.target.value)}
                className="w-full px-4 py-2.5 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple"
              >
                <option value="all">All Users</option>
                <option value="manufacturers">Manufacturers Only</option>
                <option value="buyers">Buyers Only</option>
                <option value="pending">Pending Verification</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Subject / Title</label>
              <input
                type="text"
                placeholder="e.g. New Feature Announcement"
                className="w-full px-4 py-2.5 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-sp-muted uppercase tracking-wider mb-2">Message</label>
              <textarea
                rows={5}
                placeholder="Write your broadcast message here..."
                className="w-full px-4 py-2.5 bg-sp-bg border border-sp-border rounded-xl text-sm resize-none focus:outline-none focus:border-sp-purple"
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                disabled={!broadcastTitle.trim() || !broadcastMsg.trim()}
                onClick={() => { alert(`Broadcast sent to: ${broadcastTarget}`); setBroadcastTitle(''); setBroadcastMsg('') }}
                className="flex items-center gap-2 px-6 py-3 gradient-card-purple text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" /> Send Broadcast
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-sp-bg border border-sp-border text-sp-muted rounded-xl text-sm font-medium hover:bg-sp-border transition-all">
                <Eye className="w-4 h-4" /> Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
