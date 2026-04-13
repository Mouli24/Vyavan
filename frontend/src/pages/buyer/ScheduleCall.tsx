import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Calendar, Clock, Video, Phone, CheckCircle,
  XCircle, Plus, PhoneCall, Handshake,
  ShoppingCart, ScanLine, Package, User,
  ChevronDown, Bell, Truck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const STATUS_MAP: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-sp-mint text-sp-success',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-gray-100 text-gray-600',
}

export default function ScheduleCall() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookModal, setShowBookModal] = useState(false)
  const [manufacturers, setManufacturers] = useState<any[]>([])

  // Book form
  const [selectedMfr, setSelectedMfr] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('30')
  const [purpose, setPurpose] = useState('')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getScheduledCalls(),
      api.getCompanies({ limit: 20 }),
    ]).then(([callData, mfrData]) => {
      setCalls(callData)
      setManufacturers(mfrData.data ?? [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setBooking(true)
    try {
      const call = await api.bookCall({
        manufacturerId: selectedMfr,
        scheduledAt,
        duration: +duration,
        purpose,
      })
      setCalls(prev => [call, ...prev])
      setShowBookModal(false)
      setSelectedMfr(''); setScheduledAt(''); setPurpose('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setBooking(false)
    }
  }

  const handleCancel = async (id: string) => {
    await api.cancelCall(id, 'User cancelled')
    setCalls(prev => prev.map(c => c._id === id ? { ...c, status: 'cancelled' } : c))
  }

  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>

      {/* ── Sephio Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#F0E6D8] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-900 cursor-pointer flex-shrink-0" onClick={() => navigate('/buyer/dashboard')}>
            Sephio
          </h1>
          <nav className="hidden md:flex items-center gap-2">
            {[
              { label: 'Tracking',      icon: ScanLine,   to: '/buyer/shipments', active: false },
              { label: 'My Orders',     icon: Package,    to: '/buyer/orders',    active: false },
              { label: 'Negotiation',   icon: Handshake,  to: '/buyer/dashboard', active: false },
              { label: 'Schedule Call', icon: PhoneCall,  to: '/buyer/schedule',  active: true  },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  item.active
                    ? 'bg-[#FFF0E0] border-[#F5C89A] text-[#C47A2B]'
                    : 'bg-white border-[#EEE] text-slate-600 hover:border-[#F5C89A] hover:text-[#C47A2B]'
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-[#EEE] bg-white text-slate-700 text-sm font-semibold hover:border-[#F5C89A] transition-all">
              <ShoppingCart size={16} />
              Cart
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#EEE] bg-white text-slate-700 text-sm font-semibold hover:border-[#F5C89A] transition-all"
            >
              <User size={15} />
              {user ? user.name?.split(' ')[0] : 'My Account'}
              <ChevronDown size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Page title + Book button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Schedule Calls</h2>
            <p className="text-sm text-slate-500 mt-1">Book calls with manufacturers to discuss products & pricing</p>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all"
            style={{ background: '#C47A2B' }}
          >
            <Plus size={16} /> Book Call
          </button>
        </div>
        {/* Call list */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#C47A2B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : calls.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#F0E6D8] p-16 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700 mb-1">No calls scheduled</p>
              <p className="text-sm text-slate-400 mb-6">Book a call with a manufacturer to discuss products & pricing</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="px-5 py-2.5 rounded-full text-white font-bold text-sm"
                style={{ background: '#C47A2B' }}
              >
                Book First Call
              </button>
            </div>
          ) : (
            calls.map(call => (
              <div key={call._id} className="bg-white rounded-2xl border border-[#F0E6D8] shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FFF0E0] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-[#C47A2B]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          {call.manufacturer?.company ?? call.manufacturer?.name ?? 'Manufacturer'}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(call.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {new Date(call.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs text-slate-400">{call.duration}min</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${STATUS_MAP[call.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {call.status}
                      </span>
                    </div>
                    {call.purpose && (
                      <p className="text-xs text-slate-400 mt-2 bg-[#FDF6EE] rounded-lg p-2">{call.purpose}</p>
                    )}
                    {call.meetingLink && (
                      <a
                        href={call.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[#FFF0E0] text-[#C47A2B] text-xs font-bold rounded-lg hover:opacity-80 transition-all"
                      >
                        <Video className="w-3 h-3" /> Join Meeting
                      </a>
                    )}
                  </div>
                  {call.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(call._id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Book call modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowBookModal(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-sp-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sp-purple-pale rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-sp-purple" />
              </div>
              <h3 className="font-bold text-sp-text text-lg">Book a Call</h3>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sp-text mb-1.5">Manufacturer</label>
                <select
                  value={selectedMfr}
                  onChange={e => setSelectedMfr(e.target.value)}
                  required
                  className="w-full px-3 py-3 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple"
                >
                  <option value="">Select manufacturer...</option>
                  {manufacturers.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.company ?? m.name} — {m.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sp-text mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-3 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sp-text mb-1.5">Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full px-3 py-3 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sp-text mb-1.5">Purpose / Agenda</label>
                <textarea
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Discuss pricing for bulk order, product customization..."
                  className="w-full px-3 py-3 bg-sp-bg border border-sp-border rounded-xl text-sm resize-none focus:outline-none focus:border-sp-purple"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 py-3 bg-sp-bg border border-sp-border text-sp-muted font-medium rounded-xl text-sm hover:bg-sp-border transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="flex-1 py-3 gradient-card-purple text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-60 transition-all"
                >
                  {booking ? 'Booking...' : 'Book Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
