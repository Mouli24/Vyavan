import { useState, useEffect } from 'react'
import {
  CalendarClock, Clock, User, Phone, Video,
  CheckCircle2, XCircle, RefreshCw, Loader2,
  Bell, Globe, HelpCircle, Link as LinkIcon,
  ChevronRight, Calendar,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending:    { bg: 'bg-amber-50',   text: 'text-amber-600',  dot: 'bg-amber-500',  label: 'Pending' },
  confirmed:  { bg: 'bg-green-50',   text: 'text-mfr-brown',  dot: 'bg-green-500',  label: 'Confirmed' },
  cancelled:  { bg: 'bg-red-50',     text: 'text-red-500',    dot: 'bg-red-400',    label: 'Cancelled' },
  completed:  { bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400',  label: 'Completed' },
  rescheduled:{ bg: 'bg-mfr-peach',    text: 'text-mfr-brown',   dot: 'bg-mfr-brown',   label: 'Rescheduled' },
}

function fmt(dateStr: string) {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    isPast: d < new Date(),
    isToday: d.toDateString() === new Date().toDateString(),
  }
}

export default function ScheduledCalls() {
  const { user } = useAuth()
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    api.getScheduledCalls()
      .then(setCalls)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleConfirm = async (id: string) => {
    setActionLoading(id + '-confirm')
    try {
      const updated = await api.confirmCall(id)
      setCalls(prev => prev.map(c => c._id === id ? { ...c, ...updated } : c))
    } catch (e) { console.error(e) }
    finally { setActionLoading(null) }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this scheduled call?')) return
    setActionLoading(id + '-cancel')
    try {
      const updated = await api.cancelCall(id, 'Cancelled by manufacturer')
      setCalls(prev => prev.map(c => c._id === id ? { ...c, ...updated } : c))
    } catch (e) { console.error(e) }
    finally { setActionLoading(null) }
  }

  const filtered = calls.filter(c => {
    const { isPast } = fmt(c.scheduledAt)
    if (filter === 'upcoming') return !isPast && c.status !== 'cancelled'
    if (filter === 'past') return isPast || c.status === 'completed' || c.status === 'cancelled'
    return true
  })

  const upcomingCount = calls.filter(c => {
    const { isPast } = fmt(c.scheduledAt)
    return !isPast && c.status !== 'cancelled'
  }).length

  const todayCount = calls.filter(c => fmt(c.scheduledAt).isToday && c.status !== 'cancelled').length

  return (
    <div className="flex-1 p-8 overflow-y-auto">

      {/* ── Hero ── */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">Scheduled Calls</h1>
        <p className="text-sm text-muted-foreground">Manage buyer calls and meeting requests</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-gradient-to-br from-[#F5E6D3] to-[#F9F1E7] rounded-[1.5rem] p-6 border-none"
        >
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock size={18} className="text-[#5D4037]" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#5D4037]">Upcoming</span>
          </div>
          <p className="text-4xl font-bold text-slate-900">{upcomingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">calls scheduled</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-[#F5E6D3] to-[#F9F1E7] rounded-[1.5rem] p-6 border-none"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-[#5D4037]" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#5D4037]">Today</span>
          </div>
          <p className="text-4xl font-bold text-slate-900">{todayCount}</p>
          <p className="text-xs text-muted-foreground mt-1">calls today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#F5E6D3] to-[#F9F1E7] rounded-[1.5rem] p-6 border-none"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-[#5D4037]" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#5D4037]">Total</span>
          </div>
          <p className="text-4xl font-bold text-slate-900">{calls.length}</p>
          <p className="text-xs text-muted-foreground mt-1">all time</p>
        </motion.div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2 mb-6">
        {(['upcoming', 'all', 'past'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? 'bg-[#5D4037] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {f === 'upcoming' ? 'Upcoming' : f === 'past' ? 'Past' : 'All Calls'}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {filtered.length} call{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Call list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#5D4037]" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground"
        >
          <div className="w-20 h-20 rounded-full bg-[#F5E6D3]/60 flex items-center justify-center">
            <CalendarClock size={36} className="text-[#5D4037]/40" />
          </div>
          <p className="text-sm font-semibold">No {filter === 'upcoming' ? 'upcoming' : filter === 'past' ? 'past' : ''} calls</p>
          <p className="text-xs">Buyers can schedule calls from your storefront</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((call, idx) => {
              const { date, time, isPast, isToday } = fmt(call.scheduledAt)
              const status = call.status ?? 'pending'
              const style = STATUS_STYLE[status] ?? STATUS_STYLE.pending
              const buyerName = call.buyer?.name ?? call.buyerName ?? 'Buyer'
              const buyerInitials = buyerName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

              return (
                <motion.div
                  key={call._id ?? idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`bg-white rounded-[1.5rem] border p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow ${
                    isToday && status !== 'cancelled' ? 'border-[#5D4037]/30 ring-1 ring-[#5D4037]/10' : 'border-slate-100'
                  }`}
                >
                  {/* Date block */}
                  <div className="flex-shrink-0 w-16 text-center bg-[#F5E6D3]/50 rounded-2xl py-3 px-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5D4037]">
                      {new Date(call.scheduledAt).toLocaleDateString('en-IN', { month: 'short' })}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 leading-none">
                      {new Date(call.scheduledAt).getDate()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{time}</p>
                  </div>

                  {/* Buyer info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm flex-shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${buyerName}`} />
                      <AvatarFallback className="bg-mfr-peach text-mfr-brown text-xs font-bold">{buyerInitials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{buyerName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {call.purpose ?? 'Product inquiry'}
                      </p>
                      {call.duration && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> {call.duration} min
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isToday && status !== 'cancelled' && (
                      <span className="px-2.5 py-1 bg-[#5D4037] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Today
                      </span>
                    )}
                    <Badge className={`rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 ${style.bg} ${style.text} border-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </Badge>
                  </div>

                  {/* Meeting link */}
                  {call.meetingLink && (
                    <a
                      href={call.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-mfr-peach text-mfr-brown text-xs font-bold hover:bg-mfr-peach-mid transition-colors flex-shrink-0"
                    >
                      <Video size={14} /> Join
                    </a>
                  )}

                  {/* Actions */}
                  {!isPast && status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleConfirm(call._id)}
                        disabled={actionLoading === call._id + '-confirm'}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 text-mfr-brown text-xs font-bold hover:bg-green-100 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === call._id + '-confirm'
                          ? <Loader2 size={13} className="animate-spin" />
                          : <CheckCircle2 size={13} />
                        }
                        Confirm
                      </button>
                      <button
                        onClick={() => handleCancel(call._id)}
                        disabled={actionLoading === call._id + '-cancel'}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === call._id + '-cancel'
                          ? <Loader2 size={13} className="animate-spin" />
                          : <XCircle size={13} />
                        }
                        Decline
                      </button>
                    </div>
                  )}

                  {!isPast && status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(call._id)}
                      disabled={actionLoading === call._id + '-cancel'}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors flex-shrink-0"
                    >
                      {actionLoading === call._id + '-cancel'
                        ? <Loader2 size={13} className="animate-spin" />
                        : <XCircle size={13} />
                      }
                      Cancel
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

