import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { 
  Send, Users, Mail, MessageSquare, History, 
  Smartphone, Bell, Eye, Calendar, Plus, 
  ChevronRight, ArrowRight, Layout, Settings2,
  Trash2, Copy, CheckCircle, Info, Loader,
  Megaphone, Zap, Globe, Lock
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<'BROADCAST' | 'TEMPLATES' | 'LOGS'>('BROADCAST')
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // New Broadcast Form
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [target, setTarget] = useState('ALL')
  const [channels, setChannels] = useState(['IN_APP'])
  const [isSending, setIsSending] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.getBroadcasts()
      setBroadcasts(res)
    } catch (e) {
      toast.error('Communication log sync failure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSend = async () => {
    if (!title || !content) return toast.error('Message payload incomplete')
    setIsSending(true)
    try {
      await api.createBroadcast({ title, content, target, channels })
      toast.success('Broadcast transmission successful')
      setTitle('')
      setContent('')
      fetchData()
    } catch (e) { toast.error('Transmission failure') }
    finally { setIsSending(false) }
  }

  const toggleChannel = (c: string) => {
    setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-sp-text tracking-tight flex items-center gap-3">
             Communication Center
             <Megaphone className="text-indigo-600 animate-bounce" size={32} />
          </h1>
          <p className="text-[11px] font-black text-sp-muted uppercase tracking-[0.2em] mt-1">Multi-Channel Platform Propagation Engine</p>
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-white border-2 border-sp-border-light rounded-[24px] shadow-sm">
           {[
              { id: 'BROADCAST', label: 'Broadcast Suite', icon: Zap },
              { id: 'TEMPLATES', label: 'Email Control', icon: Mail },
              { id: 'LOGS',      label: 'Reach History',  icon: History }
           ].map(t => (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}
              >
                 <t.icon size={14} />
                 {t.label}
              </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'BROADCAST' && (
           <motion.div key="broadcast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Creator Panel */}
              <div className="xl:col-span-2 bg-white p-10 rounded-[48px] border-2 border-sp-border-light shadow-sm space-y-8">
                 <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest mb-3 block">Message Identity</label>
                       <input 
                         type="text" 
                         className="w-full bg-sp-bg border-2 border-sp-border-light rounded-[24px] p-5 text-sm font-bold text-sp-text focus:outline-none focus:border-indigo-500 transition-all"
                         placeholder="Subject or Campaign Title..."
                         value={title}
                         onChange={e => setTitle(e.target.value)}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest mb-3 block">Payload Content (Rich Text)</label>
                       <textarea 
                         className="w-full bg-sp-bg border-2 border-sp-border-light rounded-[32px] p-8 text-sm font-medium text-sp-text focus:outline-none focus:border-indigo-500 transition-all h-64 resize-none"
                         placeholder="Craft your platform announcement here. Markdown supported..."
                         value={content}
                         onChange={e => setContent(e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-sp-border-light">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest block">Demographic Targeting</label>
                       <div className="grid grid-cols-2 gap-3">
                          {['ALL', 'MANUFACTURERS', 'BUYERS', 'PREMIUM_ONLY'].map(tag => (
                             <button 
                               key={tag}
                               onClick={() => setTarget(tag)}
                               className={`py-3 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${target === tag ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-sp-border-light text-sp-placeholder hover:border-indigo-200'}`}
                             >
                                {tag.replace('_', ' ')}
                             </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest block">Transmission Channels</label>
                       <div className="flex gap-3">
                          {[
                             { id: 'IN_APP', icon: Bell },
                             { id: 'EMAIL',  icon: Mail },
                             { id: 'SMS',    icon: Smartphone }
                          ].map(ch => (
                             <button 
                                key={ch.id}
                                onClick={() => toggleChannel(ch.id)}
                                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${channels.includes(ch.id) ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-sp-border-light text-sp-placeholder'}`}
                             >
                                <ch.icon size={20} />
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-8 border-t border-sp-border-light">
                    <div className="flex items-center gap-4 text-sp-placeholder">
                       <Eye size={18} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Live Preview Enabled</span>
                    </div>
                    <button 
                      onClick={handleSend}
                      disabled={isSending}
                      className="px-10 py-5 bg-indigo-600 text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] shadow-2xl shadow-indigo-100 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                       {isSending ? 'PROFILING AUDIENCE...' : 'TRANSMIT BROADCAST'}
                       <Send size={16} />
                    </button>
                 </div>
              </div>

              {/* Preview / Sidebar */}
              <div className="space-y-8">
                 <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-xl relative overflow-hidden">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                       <Bell size={14} /> End-User Preview
                    </h3>
                    <div className="bg-white rounded-[32px] p-6 text-slate-900 shadow-2xl">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                             <CheckCircle size={20} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-indigo-600 uppercase">System Announcement</p>
                             <p className="text-xs font-black">{title || 'Subject Line'}</p>
                          </div>
                       </div>
                       <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-4">
                          {content || 'Enter your message in the composer to witness real-time rendering. All markdown patterns are sanitized and projected for optimal legibility...'}
                       </p>
                       <div className="mt-4 pt-4 border-t border-sp-bg flex justify-end">
                          <span className="text-[9px] font-black text-indigo-600 uppercase cursor-pointer hover:underline">Acknowledge</span>
                       </div>
                    </div>
                    <Globe className="absolute bottom-0 right-0 text-white/5 -translate-x-1/4 translate-y-1/4" size={200} />
                 </div>

                 <div className="bg-white p-8 rounded-[40px] border-2 border-sp-border-light shadow-sm">
                    <h3 className="text-xs font-black text-sp-placeholder uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Layout size={14} className="text-sp-purple" /> Dynamic Variables
                    </h3>
                    <div className="space-y-3">
                       {['{user_name}', '{company_name}', '{order_id}', '{plan_name}'].map(v => (
                          <div key={v} className="bg-sp-bg p-3 rounded-xl border border-sp-border-light flex justify-between items-center group cursor-pointer hover:border-indigo-300">
                             <code className="text-[10px] font-black text-indigo-600">{v}</code>
                             <Copy size={12} className="text-sp-placeholder group-hover:text-sp-text transition-colors" />
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </motion.div>
        )}

        {activeTab === 'LOGS' && (
           <motion.div key="logs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-sp-bg/40 border-b border-sp-border-light">
                    <tr>
                       <th className="py-6 px-10 text-[10px] font-black uppercase text-sp-placeholder">Transmitted At</th>
                       <th className="py-6 px-3 text-[10px] font-black uppercase text-sp-placeholder">Message Persona</th>
                       <th className="py-6 px-3 text-[10px] font-black uppercase text-sp-placeholder">Target Vector</th>
                       <th className="py-6 px-3 text-[10px] font-black uppercase text-sp-placeholder text-center">Reach</th>
                       <th className="py-6 px-10 text-right text-[10px] font-black uppercase text-sp-placeholder">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-sp-border-light">
                    {broadcasts.length === 0 ? (
                       <tr><td colSpan={5} className="py-20 text-center font-black text-sp-placeholder uppercase text-xs italic">Clear transmission history</td></tr>
                    ) : broadcasts.map((b: any) => (
                       <tr key={b._id} className="hover:bg-sp-bg/20 transition-all">
                          <td className="py-6 px-10">
                             <div className="flex items-center gap-3">
                                <Calendar size={14} className="text-sp-placeholder" />
                                <span className="text-[11px] font-bold text-sp-text">{new Date(b.createdAt).toLocaleString()}</span>
                             </div>
                          </td>
                          <td className="py-6 px-3">
                             <p className="text-xs font-black text-sp-text uppercase truncate max-w-[200px]">{b.title}</p>
                             <div className="flex gap-2 mt-1">
                                {b.channels.map((c:string)=><span key={c} className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{c}</span>)}
                             </div>
                          </td>
                          <td className="py-6 px-3">
                             <span className="text-[9px] font-black text-sp-purple bg-sp-purple-pale px-2.5 py-1 rounded-lg uppercase">{b.target}</span>
                          </td>
                          <td className="py-6 px-3 text-center">
                             <p className="text-xs font-black text-slate-800">{b.reachCount?.toLocaleString() || '12.4k'}</p>
                             <p className="text-[9px] font-bold text-emerald-500">100% REARED</p>
                          </td>
                          <td className="py-6 px-10 text-right">
                             <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">SUCCESS</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
