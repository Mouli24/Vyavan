import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Calendar, Clock, Video, Phone, CheckCircle,
  XCircle, Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import BuyerNavbar from '@/components/layout/BuyerNavbar'

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

  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getScheduledCalls(),
      api.getCompanies({ limit: 20 }),
    ]).then(([callData, mfrData]) => {
      setCalls(callData)
      setManufacturers(mfrData.data ?? [])
      
      const storeAccess = localStorage.getItem('directStoreAccess')
      if (storeAccess) {
        const found = (mfrData.data ?? []).find((m: any) => m._id === storeAccess || m.company === storeAccess)
        if (found) {
          setSelectedMfr(found._id)
          setIsLocked(true)
        }
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setBooking(true)
    try {
      const call = await api.bookCall({
        manufacturerId: selectedMfr,
        scheduledAt: new Date(scheduledAt).toISOString(),
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
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      <BuyerNavbar activePage="schedule" />

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
            style={{ background: '#5D4037' }}
          >
            <Plus size={16} /> Book Call
          </button>
        </div>
        {/* Call list */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#5D4037] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : calls.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E1DA] p-16 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700 mb-1">No calls scheduled</p>
              <p className="text-sm text-slate-400 mb-6">Book a call with a manufacturer to discuss products & pricing</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="px-5 py-2.5 rounded-full text-white font-bold text-sm"
                style={{ background: '#5D4037' }}
              >
                Book First Call
              </button>
            </div>
          ) : (
            calls.map(call => (
              <div key={call._id} className="bg-white rounded-2xl border border-[#E5E1DA] shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#FCE7D6] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-[#5D4037]" />
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
                      <p className="text-xs text-slate-400 mt-2 bg-[#FAF8F5] rounded-lg p-2">{call.purpose}</p>
                    )}
                    {call.meetingLink && (
                      <a
                        href={call.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[#FCE7D6] text-[#5D4037] text-xs font-bold rounded-lg hover:opacity-80 transition-all"
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
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-[#E5E1DA]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#5D4037]-pale rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#5D4037]" />
              </div>
              <h3 className="font-bold text-[#1A1A1A] text-lg">Book a Call</h3>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Manufacturer</label>
                <select
                  value={selectedMfr}
                  onChange={e => setSelectedMfr(e.target.value)}
                  required
                  disabled={isLocked}
                  className={`w-full px-3 py-3 border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:border-[#5D4037] ${isLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-80' : 'bg-[#FAF8F5]'}`}
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
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:border-[#5D4037]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full px-3 py-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:border-[#5D4037]"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Purpose / Agenda</label>
                <textarea
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Discuss pricing for bulk order, product customization..."
                  className="w-full px-3 py-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-xl text-sm resize-none focus:outline-none focus:border-[#5D4037]"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 py-3 bg-[#FAF8F5] border border-[#E5E1DA] text-[#A89F91] font-medium rounded-xl text-sm hover:bg-[#E5E1DA] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="flex-1 py-3 bg-[#5D4037] text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-60 transition-all"
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





