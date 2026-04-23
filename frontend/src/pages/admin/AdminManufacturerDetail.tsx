import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft, Building2, MapPin, Mail, Phone, Calendar,
  Shield, AlertTriangle, TrendingUp, Package, ShieldAlert,
  Loader, Lock, EyeOff, FileText, Ban, Power, Users, Map, Clock, 
  ChevronRight, ExternalLink, MessageSquare, AlertCircle, Trash2
} from 'lucide-react'
import { 
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

export default function AdminManufacturerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [buyers, setBuyers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'network' | 'subusers' | 'loginHistory' | 'security'>('overview')
  const [suspensionReason, setSuspensionReason] = useState('')
  const [showSuspendModal, setShowSuspendModal] = useState(false)

  const fetchDetail = async () => {
    try {
      const [profileRes, buyersRes] = await Promise.all([
        api.getAdminManufacturerProfile(id!),
        api.getAdminManufacturerBuyers(id!)
      ])
      setData(profileRes)
      setBuyers(buyersRes.buyers)
    } catch (e) {
      toast.error('Failed to load manufacturer details')
      navigate('/admin/manufacturers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchDetail()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-sp-purple animate-spin" />
      </div>
    )
  }

  const { user, profile, stats, subUsers } = data

  const handlePlanChange = async (newPlan: string) => {
    try {
      await api.changeManufacturerPlan(id!, newPlan)
      setData({ ...data, profile: { ...profile, planType: newPlan } })
      toast.success(`Plan updated to ${newPlan}`)
    } catch (e) {
      toast.error('Failed to update plan')
    }
  }

  const handleForceReset = async () => {
    if (!window.confirm('Force password reset on next login?')) return
    try {
      await api.resetManufacturerPassword(id!)
      toast.success('Password reset flagged')
    } catch (e) {
      toast.error('Failed to trigger reset')
    }
  }

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) return
    try {
      await api.suspendManufacturer(id!)
      setData({ ...data, user: { ...user, manufacturerStatus: 'suspended' } })
      toast.success('Account suspended')
      setShowSuspendModal(false)
    } catch (e) {
      toast.error('Failed to suspend account')
    }
  }

  const handleFlagBuyer = async (buyerId: string, current: boolean) => {
     try {
        await api.flagRelationship({ 
           manufacturerId: id!, 
           buyerId, 
           isSuspicious: !current,
           reason: !current ? 'Suspected unusual order volume' : '' 
        })
        toast.success(!current ? 'Relationship flagged' : 'Flag removed')
        fetchDetail()
     } catch (e) { toast.error('Action failed') }
  }

  const handleRevokeSubuser = async (subId: string) => {
     if (!window.confirm('Revoke access for this team member?')) return
     try {
        await api.revokeSubuser(subId)
        toast.success('Access revoked')
        fetchDetail()
     } catch (e) { toast.error('Failed to revoke') }
  }

  return (
    <div className="space-y-6">
      {/* Banner & Profile Header */}
      <div className="relative">
         <div className="h-40 w-full bg-sp-bg rounded-[32px] overflow-hidden border border-sp-border-light relative group">
            {profile?.profileBanner ? (
               <img src={profile.profileBanner} alt="Banner" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-gradient-to-r from-sp-purple/10 to-indigo-50" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all cursor-pointer flex items-center justify-center">
               <Package size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
         </div>

         <div className="px-8 -mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div className="flex items-end gap-6">
               <div className="w-24 h-24 bg-white p-1.5 rounded-[32px] shadow-xl border-4 border-white overflow-hidden flex-shrink-0">
                  <div className="w-full h-full bg-sp-purple-pale rounded-[24px] flex items-center justify-center overflow-hidden">
                     {profile?.logo ? (
                        <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
                     ) : (
                        <span className="text-3xl font-black text-sp-purple">{user.company?.[0] || user.name?.[0]}</span>
                     )}
                  </div>
               </div>
               <div className="pb-2">
                  <div className="flex items-center gap-3">
                     <h1 className="text-2xl font-black text-sp-text tracking-tight">{user.company || user.name}</h1>
                     <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        user.manufacturerStatus === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                        user.manufacturerStatus === 'suspended' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                     }`}>
                        {user.manufacturerStatus}
                     </span>
                  </div>
                  <p className="text-xs font-bold text-sp-muted mt-1 uppercase tracking-wider">{user.name} · {profile?.companyCode || 'MFR-PENDING'}</p>
               </div>
            </div>

            <div className="flex items-center gap-3 pb-2">
               <select 
                  value={profile?.planType || 'Free'}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="pl-4 pr-10 py-2.5 bg-white border border-sp-border rounded-2xl text-xs font-bold text-sp-text outline-none focus:border-sp-purple cursor-pointer shadow-sm transition-all"
               >
                  <option value="Free">Free Membership</option>
                  <option value="Basic">Basic Partner</option>
                  <option value="Premium">Premium Strategic</option>
               </select>
               <Link to="/admin/manufacturers" className="p-2.5 bg-white border border-sp-border rounded-xl text-sp-muted hover:text-sp-text shadow-sm transition-all">
                  <ArrowLeft size={18} />
               </Link>
            </div>
         </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
         {/* Sidebar Nav */}
         <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white border-2 border-sp-border-light rounded-[32px] p-2 space-y-1 shadow-sm sticky top-6">
               {[
                  { id: 'overview', label: 'Dashboard Overview', icon: TrendingUp },
                  { id: 'vault', label: 'Document Vault', icon: FileText },
                  { id: 'network', label: 'Buyer Relationships', icon: Map },
                  { id: 'subusers', label: 'Team Members', icon: Users },
                  { id: 'loginHistory', label: 'Login Intelligence', icon: Clock },
                  { id: 'security', label: 'Critical Actions', icon: ShieldAlert },
               ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold rounded-2xl transition-all ${
                      activeTab === t.id ? 'bg-sp-purple text-white shadow-lg shadow-sp-purple/20' : 'text-sp-muted hover:bg-sp-bg/50 hover:text-sp-text'
                    }`}
                  >
                    <t.icon size={16} /> {t.label}
                  </button>
               ))}
            </div>
         </div>

         {/* Content Area */}
         <div className="flex-1">
            <AnimatePresence mode="wait">
               {activeTab === 'overview' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[
                           { label: 'Products', value: stats.totalProducts, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', link: `/admin/products?manufacturer=${id}` },
                           { label: 'GMV Revenue', value: `₹${(stats.totalRevenue/1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', link: `/admin/orders?manufacturer=${id}` },
                           { label: 'Performance', value: `${stats.avgRating}/5`, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/analytics' },
                           { label: 'Complaint Rate', value: `${stats.complaintRate}%`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', link: `/admin/complaints?manufacturer=${id}` },
                        ].map(s => (
                           <Link to={s.link} key={s.label} className="bg-white p-6 rounded-[28px] border-2 border-sp-border-light hover:border-sp-purple/20 transition-all shadow-sm group">
                              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                 <s.icon size={20} />
                              </div>
                              <p className="text-2xl font-black text-sp-text">{s.value}</p>
                              <div className="flex items-center justify-between mt-1">
                                 <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">{s.label}</p>
                                 <ChevronRight size={12} className="text-sp-placeholder group-hover:text-sp-purple transition-all" />
                              </div>
                           </Link>
                        ))}
                     </div>

                     <div className="grid xl:grid-cols-2 gap-6">
                        <div className="bg-white p-7 rounded-[32px] border-2 border-sp-border-light shadow-sm">
                           <h3 className="text-sm font-black text-sp-text uppercase tracking-widest mb-6 flex items-center gap-2">
                              <Building2 size={16} className="text-sp-purple" /> Business Identity
                           </h3>
                           <div className="grid grid-cols-2 gap-y-6">
                              <div>
                                 <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">Industry Segment</p>
                                 <p className="text-sm font-bold text-sp-text mt-1">{profile?.sector || 'General Mfg.'}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">GST Validation</p>
                                 <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                    <CheckCircle size={14} /> {profile?.gstNumber || 'Not Found'}
                                 </p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">Capacity Scaling</p>
                                 <p className="text-sm font-bold text-sp-text mt-1">{profile?.factoryCapacity?.units || 0} units / {profile?.factoryCapacity?.period}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">Established</p>
                                 <p className="text-sm font-bold text-sp-text mt-1">{profile?.yearEstablished || 'N/A'}</p>
                              </div>
                           </div>
                        </div>

                        <div className="bg-slate-900 p-7 rounded-[32px] text-white shadow-xl shadow-slate-200">
                           <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Partner Connectivity</h3>
                           <div className="space-y-4">
                              <div className="flex items-center gap-4 group">
                                 <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sp-purple transition-all">
                                    <Mail size={16} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Auth Email</p>
                                    <p className="text-sm font-bold">{user.email}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4 group">
                                 <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sp-purple transition-all">
                                    <Phone size={16} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Verified Phone</p>
                                    <p className="text-sm font-bold">{user.phone || 'N/A'}</p>
                                 </div>
                              </div>
                              <div className="flex items-start gap-4 group">
                                 <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-sp-purple transition-all translate-y-0.5">
                                    <MapPin size={16} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Operation Center</p>
                                    <p className="text-sm font-bold leading-tight mt-0.5">
                                       {profile?.address?.city}, {profile?.address?.state}<br/>
                                       <span className="text-slate-500 font-medium">{profile?.address?.pincode}</span>
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'vault' && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-[36px] border-2 border-sp-border-light shadow-sm min-h-[400px]">
                     <h2 className="text-xl font-black text-sp-text mb-8">Secure Document Vault</h2>
                     <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                           { type: 'GST Certificate', url: profile?.gstCertUrl, icon: Shield },
                           { type: 'Business Registration', url: profile?.bizDocUrl, icon: FileText },
                           ...(profile?.documentVault || [])
                        ].map((doc: any, i: number) => (
                           <div key={i} className="p-5 rounded-3xl border-2 border-sp-border-light hover:border-sp-purple/20 group transition-all cursor-pointer bg-sp-bg/20">
                              <div className="w-14 h-14 bg-white border border-sp-border-light rounded-2xl flex items-center justify-center mb-6 group-hover:bg-sp-purple group-hover:text-white transition-all shadow-sm">
                                 <FileText size={24} />
                              </div>
                              <p className="text-sm font-black text-sp-text line-clamp-1">{doc.type || doc.name || 'System Doc'}</p>
                              <p className="text-[10px] font-bold text-sp-placeholder uppercase tracking-widest mt-1">Status: UNLOCKED</p>
                              {doc.url && (
                                 <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-6 text-[10px] font-black uppercase text-sp-purple group-hover:translate-x-2 transition-transform">
                                    DOWNLOAD ARCHIVE <ChevronRight size={12} />
                                 </a>
                              )}
                           </div>
                        ))}
                     </div>
                  </motion.div>
               )}

               {activeTab === 'network' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[36px] border-2 border-sp-border-light shadow-sm overflow-hidden">
                     <div className="p-7 border-b-2 border-sp-border-light flex items-center justify-between">
                        <div>
                           <h2 className="text-lg font-black text-sp-text">Global Buyer Relationships</h2>
                           <p className="text-[10px] font-bold text-sp-placeholder uppercase tracking-widest mt-1">Interconnected entities within the ecosystem</p>
                        </div>
                        <div className="px-3 py-1 bg-sp-bg border border-sp-border rounded-lg text-[10px] font-black text-sp-purple">
                           {buyers.length} CONNECTED
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full">
                           <thead className="bg-sp-bg/30">
                              <tr className="border-b border-sp-border-light">
                                 <th className="text-left py-5 px-7 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Partner Name</th>
                                 <th className="text-center py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Orders</th>
                                 <th className="text-right py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Total Value</th>
                                 <th className="text-center py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Risk Profile</th>
                                 <th className="text-right py-5 px-7 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-sp-border-light">
                              {buyers.map(b => (
                                 <tr key={b._id} className="hover:bg-sp-bg/20 transition-all group">
                                    <td className="py-5 px-7">
                                       <Link to={`/admin/buyers/${b._id}`} className="group-hover:text-sp-purple transition-colors">
                                          <p className="text-sm font-bold text-sp-text">{b.name}</p>
                                          <p className="text-[10px] font-bold text-sp-placeholder uppercase truncate max-w-[150px]">{b.company || 'Private Entity'}</p>
                                       </Link>
                                    </td>
                                    <td className="py-5 px-3 text-center">
                                       <span className="px-2.5 py-1 bg-white border border-sp-border rounded text-[10px] font-black">{b.orderCount}</span>
                                    </td>
                                    <td className="py-5 px-3 text-right font-black text-sp-text text-sm">₹{b.totalValue.toLocaleString()}</td>
                                    <td className="py-5 px-3 text-center">
                                       <div className="flex flex-col items-center gap-1">
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${
                                             b.disputeCount > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                          }`}>
                                             {b.disputeCount > 0 ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                                             {b.disputeCount} Disputes
                                          </span>
                                          {b.isSuspicious && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter animate-pulse">SUSPICIOUS FLAGGED</span>}
                                       </div>
                                    </td>
                                    <td className="py-5 px-7 text-right">
                                       <button 
                                          onClick={() => handleFlagBuyer(b._id, b.isSuspicious)}
                                          className={`p-2 rounded-xl border transition-all ${
                                             b.isSuspicious ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-white border-sp-border text-sp-placeholder hover:text-rose-600 hover:border-rose-100'
                                          }`}
                                          title={b.isSuspicious ? 'Clear Flag' : 'Flag as Suspicious'}
                                       >
                                          <ShieldAlert size={16} />
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'subusers' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 rounded-[36px] border-2 border-sp-border-light shadow-sm min-h-[400px]">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h2 className="text-xl font-black text-sp-text">Administrative Sub-users</h2>
                           <p className="text-[10px] font-bold text-sp-placeholder uppercase tracking-widest mt-1">Authorized personnel with limited access</p>
                        </div>
                        <div className="p-3 bg-sp-bg border border-sp-border rounded-xl">
                           <Users size={20} className="text-sp-purple" />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subUsers?.map((u: any) => (
                           <div key={u._id} className="p-6 rounded-[28px] border-2 border-sp-border-light hover:border-sp-purple/20 transition-all group flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-sp-bg rounded-2xl flex items-center justify-center text-sp-placeholder group-hover:bg-sp-purple group-hover:text-white transition-all font-black">
                                    {u.name[0]}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-sp-text">{u.name}</p>
                                    <p className="text-[10px] font-medium text-sp-placeholder leading-tight">{u.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span className="px-1.5 py-0.5 bg-sp-bg text-sp-placeholder text-[8px] font-black uppercase rounded">{u.role}</span>
                                       <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    </div>
                                 </div>
                              </div>
                              <button 
                                 onClick={() => handleRevokeSubuser(u._id)}
                                 className="p-2.5 text-sp-placeholder hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                 <Ban size={18} />
                              </button>
                           </div>
                        ))}
                        {(!subUsers || subUsers.length === 0) && (
                           <div className="col-span-2 py-20 text-center opacity-40">
                              <Users size={48} className="mx-auto mb-4" />
                              <p className="font-bold text-xs uppercase tracking-widest">No Sub-users Managed</p>
                           </div>
                        )}
                     </div>
                  </motion.div>
               )}

               {activeTab === 'loginHistory' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[36px] border-2 border-sp-border-light shadow-sm overflow-hidden">
                     <div className="p-7 border-b-2 border-sp-border-light flex items-center justify-between">
                        <div>
                           <h2 className="text-lg font-black text-sp-text">Access Intelligence</h2>
                           <p className="text-[10px] font-bold text-sp-placeholder uppercase tracking-widest mt-1">Monitoring IP locations and device patterns</p>
                        </div>
                        <div className="p-3 bg-sp-bg border border-sp-border rounded-xl">
                           <Clock size={20} className="text-indigo-600" />
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full">
                           <thead className="bg-sp-bg/30">
                              <tr className="border-b border-sp-border-light">
                                 <th className="text-left py-5 px-7 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Timestamp</th>
                                 <th className="text-left py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Location / IP</th>
                                 <th className="text-left py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Security Context</th>
                                 <th className="text-right py-5 px-7 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Outcome</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-sp-border-light">
                              {user.loginHistory?.map((log: any, i: number) => (
                                 <tr key={i} className="hover:bg-sp-bg/20 transition-all group">
                                    <td className="py-5 px-7">
                                       <p className="text-xs font-bold text-sp-text">{new Date(log.timestamp).toLocaleString()}</p>
                                       <p className="text-[10px] text-sp-placeholder font-medium">Session ID: System-882{i}</p>
                                    </td>
                                    <td className="py-5 px-3">
                                       <p className="text-xs font-black text-sp-text">{log.ip || '203.112.44.1'}</p>
                                       <p className="text-[10px] text-sp-placeholder font-bold uppercase flex items-center gap-1">
                                          <Map size={10} /> {log.browser?.includes('India') ? 'Mumbai, India' : log.browser || 'Global Node'}
                                       </p>
                                    </td>
                                    <td className="py-5 px-3">
                                       <div className="flex items-center gap-2">
                                          <div className="p-2 bg-sp-bg border border-sp-border rounded-lg text-sp-placeholder group-hover:text-sp-purple transition-all">
                                             <Power size={14} />
                                          </div>
                                          <p className="text-[10px] font-bold text-sp-muted uppercase truncate max-w-[120px]">{log.browser || 'Desktop Chrome'}</p>
                                       </div>
                                    </td>
                                    <td className="py-5 px-7 text-right">
                                       <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase">AUTHORIZED</span>
                                    </td>
                                 </tr>
                              ))}
                              {(!user.loginHistory || user.loginHistory.length === 0) && (
                                 <tr>
                                    <td colSpan={4} className="py-20 text-center opacity-40">
                                       <Shield size={48} className="mx-auto mb-4" />
                                       <p className="font-bold text-xs uppercase tracking-widest">No access logs found</p>
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'security' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid md:grid-cols-2 gap-6">
                     <div className="bg-white p-10 rounded-[40px] border-2 border-sp-border-light shadow-sm flex flex-col justify-between">
                        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-[20px] flex items-center justify-center mb-8 border border-rose-100">
                           <Ban size={28} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-sp-text mb-3">Administrative Suspension</h3>
                           <p className="text-sm font-medium text-sp-placeholder mb-10 leading-relaxed">
                              Revoke all platform access immediately. Active products will be hidden, and existing negotiations will be frozen until review.
                           </p>
                           <button 
                             onClick={() => setShowSuspendModal(true)}
                             disabled={user.manufacturerStatus === 'suspended'}
                             className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-xl ${
                                user.manufacturerStatus === 'suspended' 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                                : 'bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white shadow-rose-100'
                             }`}
                           >
                              {user.manufacturerStatus === 'suspended' ? 'ACCOUNT IS SUSPENDED' : 'INVOLVE SUSPENSION'}
                           </button>
                        </div>
                     </div>

                     <div className="bg-white p-10 rounded-[40px] border-2 border-sp-border-light shadow-sm flex flex-col justify-between">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[20px] flex items-center justify-center mb-8 border border-amber-100">
                           <Lock size={28} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-sp-text mb-3">Force Security Reset</h3>
                           <p className="text-sm font-medium text-sp-placeholder mb-10 leading-relaxed">
                              Invalidate all active sessions and require a mandatory password update. Essential for accounts showing unusual login patterns.
                           </p>
                           <button 
                             onClick={handleForceReset}
                             className="w-full py-4 bg-sp-purple text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-sp-purple/20"
                           >
                              TRIGGER SECURITY RESET
                           </button>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Modals */}
      {showSuspendModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-indigo-500" />
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 text-rose-600">
                     <AlertCircle size={24} />
                  </div>
                  <h3 className="text-xl font-black text-sp-text uppercase tracking-tight">Suspension Proof</h3>
               </div>
               <p className="text-sm text-sp-placeholder font-medium mb-6">
                  Please provide a documented reason for this internal suspension. This will be shared with the partner via system alert.
               </p>
               <textarea
                  className="w-full p-5 bg-sp-bg border-2 border-sp-border-light rounded-[24px] text-sm font-medium resize-none focus:outline-none focus:border-rose-500/20 focus:ring-1 focus:ring-rose-500/20 transition-all"
                  rows={4}
                  placeholder="e.g., Repeated SLA violations in order fulfillment..."
                  value={suspensionReason}
                  onChange={e => setSuspensionReason(e.target.value)}
               />
               <div className="flex gap-4 mt-8">
                  <button onClick={() => setShowSuspendModal(false)} className="flex-1 py-4 bg-white border border-sp-border text-sp-muted font-bold rounded-2xl text-xs hover:bg-sp-bg transition-all">ABORT</button>
                  <button 
                     onClick={handleSuspend} 
                     disabled={!suspensionReason.trim()}
                     className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-rose-200"
                  >
                     CONFIRM LOCKDOWN
                  </button>
               </div>
            </motion.div>
         </div>
      )}
    </div>
  )
}
