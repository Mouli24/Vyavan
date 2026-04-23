import { useEffect, useState } from 'react'
import { api, BuyerGroup } from '@/lib/api'
import { Users, Plus, Star, Truck, Percent, CreditCard, ChevronRight, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ManufacturerGroups() {
  const [groups, setGroups] = useState<BuyerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newGroup, setNewGroup] = useState<Partial<BuyerGroup>>({
    name: '',
    description: '',
    rewardType: 'percentage_discount',
    rewardValue: 0
  })

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const data = await api.getGroups()
      setGroups(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    try {
      await api.createGroup(newGroup)
      setShowModal(false)
      loadGroups()
    } catch (e) {
      alert('Failed to create group')
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-mfr-dark tracking-tight">Buyer Groups</h1>
          <p className="text-mfr-muted text-sm mt-1">Manage VIP tiers and automated rewards for your loyal customers.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/manufacturer/groups/pool"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-mfr-border rounded-xl text-sm font-bold text-mfr-dark hover:bg-gray-50 transition-all shadow-sm"
          >
            <Users className="w-4 h-4" /> Manage Members
          </Link>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-mfr-brown text-white rounded-xl text-sm font-extrabold hover:bg-mfr-brown-hover transition-all shadow-lg shadow-mfr-brown/20"
          >
            <Plus className="w-4 h-4" /> Create Group
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-mfr-border p-20 text-center">
          <div className="w-20 h-20 bg-mfr-peach/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-mfr-brown" />
          </div>
          <h3 className="text-xl font-bold text-mfr-dark mb-2">No Groups Created</h3>
          <p className="text-mfr-muted max-w-sm mx-auto mb-8 text-sm">
            Start by creating a group like "VIP Clients" to give automatic discounts to your best buyers.
          </p>
          <button onClick={() => setShowModal(true)} className="text-mfr-brown font-black uppercase tracking-widest text-xs hover:underline">
            Create your first group now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group._id} className="group bg-white rounded-[2rem] border border-mfr-border p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${
                  group.rewardType === 'percentage_discount' ? 'bg-blue-50 text-blue-600' :
                  group.rewardType === 'free_shipping' ? 'bg-green-50 text-green-600' :
                  'bg-mfr-peach text-mfr-brown'
                }`}>
                  {group.rewardType === 'percentage_discount' ? <Percent className="w-6 h-6" /> :
                   group.rewardType === 'free_shipping' ? <Truck className="w-6 h-6" /> :
                   group.rewardType === 'priority_badge' ? <Star className="w-6 h-6" /> :
                   <CreditCard className="w-6 h-6" />}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                  <Users className="w-3 h-3 text-mfr-muted" />
                  <span className="text-xs font-black text-mfr-dark">{group.memberCount || 0}</span>
                </div>
              </div>

              <h4 className="text-xl font-black text-mfr-dark mb-1">{group.name}</h4>
              <p className="text-xs text-mfr-muted mb-4 line-clamp-2 h-8">{group.description || 'No description provided.'}</p>

              <div className="p-4 bg-mfr-bg/50 rounded-2xl border border-mfr-border mb-6">
                <p className="text-[10px] font-black text-mfr-muted uppercase tracking-widest mb-1">Active Reward</p>
                <p className="text-sm font-extrabold text-mfr-dark uppercase">
                  {group.rewardType === 'percentage_discount' ? `${group.rewardValue}% Discount` :
                   group.rewardType === 'flat_discount' ? `$${group.rewardValue} Off Order` :
                   group.rewardType === 'free_shipping' ? 'Free Shipping' :
                   'Priority Processing'}
                </p>
              </div>

              <Link 
                to="/manufacturer/groups/pool"
                className="w-full py-3 flex items-center justify-center gap-2 bg-mfr-dark text-white rounded-xl text-xs font-black hover:bg-black transition-colors"
              >
                Manage Members <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-mfr-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-mfr-brown" />
            <h3 className="text-2xl font-black text-mfr-dark mb-6 tracking-tight">Create Buyer Group</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-mfr-muted uppercase tracking-widest mb-2">Group Name</label>
                <input 
                  type="text" 
                  value={newGroup.name}
                  onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                  className="w-full bg-gray-50 border border-mfr-border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-mfr-brown/20"
                  placeholder="e.g. VIP Clients"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-mfr-muted uppercase tracking-widest mb-2">Reward Type</label>
                <select 
                  value={newGroup.rewardType}
                  onChange={e => setNewGroup({...newGroup, rewardType: e.target.value as any})}
                  className="w-full bg-gray-50 border border-mfr-border rounded-xl p-4 text-sm focus:outline-none"
                >
                  <option value="percentage_discount">Percentage Discount</option>
                  <option value="flat_discount">Flat Amount Off</option>
                  <option value="free_shipping">Free Shipping</option>
                  <option value="priority_badge">Priority Processing Badge</option>
                </select>
              </div>

              {(newGroup.rewardType === 'percentage_discount' || newGroup.rewardType === 'flat_discount') && (
                <div>
                  <label className="block text-[10px] font-black text-mfr-muted uppercase tracking-widest mb-2">
                    {newGroup.rewardType === 'percentage_discount' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
                  </label>
                  <input 
                    type="number" 
                    value={newGroup.rewardValue}
                    onChange={e => setNewGroup({...newGroup, rewardValue: Number(e.target.value)})}
                    className="w-full bg-gray-50 border border-mfr-border rounded-xl p-4 text-sm focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-mfr-muted uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                  className="w-full bg-gray-50 border border-mfr-border rounded-xl p-4 text-sm focus:outline-none h-24 resize-none"
                  placeholder="What makes this group special?"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-sm font-black text-mfr-muted hover:text-mfr-dark transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateGroup}
                className="flex-[2] py-4 bg-mfr-brown text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-mfr-brown/30 transition-all"
              >
                Save Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
