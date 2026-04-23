import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { motion } from 'motion/react'
import {
  ArrowLeft, Building2, MapPin, Mail, Phone, Calendar,
  Shield, AlertTriangle, TrendingUp, Package, ShieldAlert,
  Loader, Lock, EyeOff, FileText, Ban, Power
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminManufacturerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [buyers, setBuyers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'network' | 'security'>('overview')

  useEffect(() => {
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
    if (id) fetchDetail()
  }, [id, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    )
  }

  const { user, profile, stats } = data

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
    if (!window.confirm(`Suspend account for ${user.name}?`)) return
    try {
      await api.suspendManufacturer(id!)
      setData({ ...data, user: { ...user, manufacturerStatus: 'suspended' } })
      toast.success('Account suspended')
    } catch (e) {
      toast.error('Failed to suspend account')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/manufacturers" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <ArrowLeft size={16} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              {user.name}
              {profile?.isVerified && <Shield className="w-5 h-5 text-emerald-500" />}
            </h1>
            <p className="text-sm font-bold text-slate-400">{user.company} · {profile?.companyCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <select 
              value={profile?.planType || 'Free'}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none hover:border-amber-500 transition-colors"
           >
              <option value="Free">Free Plan</option>
              <option value="Basic">Basic Plan</option>
              <option value="Premium">Premium Plan</option>
           </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'vault', label: 'Document Vault', icon: FileText },
          { id: 'network', label: 'Buyer Network', icon: Building2 },
          { id: 'security', label: 'Security & Actions', icon: ShieldAlert },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeTab === t.id ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                       <Package size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalProducts}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Listed Products</p>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                       <TrendingUp size={20} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">₹{(stats.totalRevenue / 1000).toFixed(1)}K</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total GMV</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Business Profile</h3>
                 <div className="grid sm:grid-cols-2 gap-y-6">
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Industry focus</p>
                       <p className="text-sm font-bold text-slate-700 mt-1">{profile?.sector || 'General Manufacturing'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turnover</p>
                       <p className="text-sm font-bold text-slate-700 mt-1">{profile?.annualTurnover || 'Not disclosed'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity</p>
                       <p className="text-sm font-bold text-slate-700 mt-1">{profile?.factoryCapacity?.units || 0} units/{profile?.factoryCapacity?.period}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Established</p>
                       <p className="text-sm font-bold text-slate-700 mt-1">{profile?.yearEstablished || 'N/A'}</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Contact Info Widget */}
              <div className="bg-slate-900 p-6 rounded-[24px] text-white shadow-xl">
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-2xl font-black mb-6">
                    {user.name[0]}
                 </div>
                 <h3 className="font-bold mb-4 uppercase tracking-widest text-xs text-slate-500">Contact Details</h3>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <Mail size={14} className="text-slate-400" />
                       <span className="text-sm font-medium text-slate-300">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Phone size={14} className="text-slate-400" />
                       <span className="text-sm font-medium text-slate-300">{user.phone || profile?.contactPerson?.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-start gap-3">
                       <MapPin size={14} className="text-slate-400 mt-1" />
                       <span className="text-sm font-medium text-slate-300 leading-tight">
                          {profile?.address?.street}<br/>
                          {profile?.address?.city}, {profile?.address?.state}<br/>
                          {profile?.address?.pincode}
                       </span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Calendar size={14} className="text-slate-400" />
                       <span className="text-sm font-medium text-slate-300">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <h2 className="text-xl font-black text-slate-800 mb-6">Verification Documents</h2>
             {profile?.documentVault && profile.documentVault.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                   {profile.documentVault.map((doc: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl border border-slate-200 hover:border-amber-500 transition-colors group cursor-pointer">
                         <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                            <FileText size={20} />
                         </div>
                         <p className="text-sm font-bold text-slate-700">{doc.type}</p>
                         <p className="text-xs font-medium text-slate-400 mt-1">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                         <a href={doc.url} target="_blank" rel="noreferrer" className="block mt-4 text-[10px] font-black uppercase tracking-widest text-amber-600">View Document &rarr;</a>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="text-center py-20 text-slate-400">
                   <ShieldAlert size={48} className="mx-auto mb-4 text-slate-200" />
                   <p className="font-bold">No documents uploaded to the vault yet.</p>
                </div>
             )}
          </div>
        )}

        {activeTab === 'network' && (
          <div className="bg-white p-0 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-800">Buyer Network</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Entities placing orders with this manufacturer</p>
             </div>
             {buyers.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                   <Building2 size={48} className="mx-auto mb-4 text-slate-200" />
                   <p className="font-bold">No active buyer relationships found.</p>
                </div>
             ) : (
                <table className="w-full">
                   <thead className="bg-slate-50">
                      <tr>
                         <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Buyer</th>
                         <th className="text-center py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Orders</th>
                         <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Value</th>
                         <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Order</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {buyers.map(b => (
                         <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6">
                               <p className="text-sm font-bold text-slate-800">{b.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{b.company}</p>
                            </td>
                            <td className="py-4 px-6 text-center">
                               <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black">{b.orderCount}</span>
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-emerald-600">
                               ₹{b.totalValue.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right text-xs font-bold text-slate-500">
                               {new Date(b.lastOrder).toLocaleDateString()}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                   <Ban size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Account Suspension</h3>
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                   Suspending this account will immediately revoke login access and hide all active product listings from the buyer marketplace.
                </p>
                <button 
                  onClick={handleSuspend}
                  disabled={user.manufacturerStatus === 'suspended'}
                  className="w-full py-3 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                   {user.manufacturerStatus === 'suspended' ? 'Currently Suspended' : 'Suspend Account'}
                </button>
             </div>

             <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                   <Lock size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Force Password Reset</h3>
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                   Flag this account to force a mandatory password reset on their next login attempt. Use this if you suspect unauthorized access.
                </p>
                <button 
                  onClick={handleForceReset}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-200"
                >
                   Trigger Reset
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
