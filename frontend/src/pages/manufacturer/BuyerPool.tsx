import { useEffect, useState } from 'react'
import { api, BuyerPoolMember, BuyerGroup } from '@/lib/api'
import { Search, Filter, UserCheck, UserMinus, MoreVertical, Star, TrendingUp, Calendar, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BuyerPool() {
  const [members, setMembers] = useState<BuyerPoolMember[]>([])
  const [groups, setGroups] = useState<BuyerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([])
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'high_value' | 'frequent'>('all')

  useEffect(() => {
    Promise.all([api.getBuyerPool(), api.getGroups()])
      .then(([pool, groups]) => {
        setMembers(pool)
        setGroups(groups)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'high_value') return matchesSearch && m.totalSpent > 10000;
    if (filterType === 'frequent') return matchesSearch && m.totalOrders > 5;
    return matchesSearch;
  });

  const handleBulkAdd = async (groupId: string) => {
    try {
      await api.addMembersToGroup(groupId, selectedBuyers);
      alert(`Added ${selectedBuyers.length} buyers to group`);
      setSelectedBuyers([]);
      setShowBulkAdd(false);
      api.getBuyerPool().then(setMembers);
    } catch (e) {
      alert('Failed to add members');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedBuyers(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleRemoveFromGroup = async (buyerId: string) => {
    if (!confirm('Are you sure you want to remove this buyer from their group?')) return;
    try {
      await api.removeMemberFromGroup(buyerId);
      api.getBuyerPool().then(setMembers);
    } catch (e) {
      alert('Failed to remove');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/manufacturer/groups" className="p-2 bg-white border border-mfr-border rounded-xl hover:bg-gray-50 transition-all">
          <ChevronLeft className="w-5 h-5 text-mfr-dark" />
        </Link>
        <h1 className="text-2xl font-black text-mfr-dark tracking-tight">Buyer Pool</h1>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', val: members.length, icon: UserCheck, color: 'text-blue-600' },
          { label: 'Unassigned Buyers', val: members.filter(m => !m.currentGroup).length, icon: UserMinus, color: 'text-amber-600' },
          { label: 'Group Members', val: members.filter(m => m.currentGroup).length, icon: Star, color: 'text-mfr-brown' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-mfr-border p-5 rounded-3xl shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-gray-50 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-mfr-muted uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-mfr-dark">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-mfr-border rounded-[2.5rem] overflow-hidden shadow-xl shadow-mfr-dark/5">
        {/* Header / Search */}
        <div className="p-6 border-b border-mfr-border flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-mfr-border w-full md:w-auto">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${filterType === 'all' ? 'bg-mfr-brown text-white shadow-md' : 'text-mfr-muted hover:text-mfr-dark'}`}
            >
              All Buyers
            </button>
            <button 
              onClick={() => setFilterType('high_value')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${filterType === 'high_value' ? 'bg-mfr-brown text-white shadow-md' : 'text-mfr-muted hover:text-mfr-dark'}`}
            >
              High Value (&gt;$10k)
            </button>
            <button 
              onClick={() => setFilterType('frequent')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${filterType === 'frequent' ? 'bg-mfr-brown text-white shadow-md' : 'text-mfr-muted hover:text-mfr-dark'}`}
            >
              Frequent (&gt;5 Orders)
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mfr-muted" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              className="w-full bg-white border border-mfr-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-mfr-brown/20"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedBuyers.length > 0 && (
          <div className="bg-mfr-brown text-white px-8 py-4 flex items-center justify-between animate-in slide-in-from-top-full">
            <p className="text-sm font-bold">{selectedBuyers.length} buyers selected</p>
            <div className="flex gap-3 items-center">
              <span className="text-xs opacity-80 mr-2">Assign to:</span>
              <div className="flex gap-2 flex-wrap">
                {groups.map(group => (
                  <button 
                    key={group._id} 
                    onClick={() => handleBulkAdd(group._id)}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-black border border-white/20 transition-all"
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-mfr-border text-left">
                <th className="p-6">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-mfr-border text-mfr-brown focus:ring-mfr-brown shadow-sm cursor-pointer"
                    checked={selectedBuyers.length === filteredMembers.length && filteredMembers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedBuyers(filteredMembers.map(m => m._id));
                      else setSelectedBuyers([]);
                    }}
                  />
                </th>
                <th className="p-6 text-[10px] font-black text-mfr-muted uppercase tracking-widest">Buyer Info</th>
                <th className="p-6 text-[10px] font-black text-mfr-muted uppercase tracking-widest text-center">Stats</th>
                <th className="p-6 text-[10px] font-black text-mfr-muted uppercase tracking-widest">Growth</th>
                <th className="p-6 text-[10px] font-black text-mfr-muted uppercase tracking-widest text-center">Condition</th>
                <th className="p-6 text-[10px] font-black text-mfr-muted uppercase tracking-widest text-right">Current Group</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <tr key={member._id} className={`group border-b border-mfr-border hover:bg-mfr-peach/10 transition-colors ${selectedBuyers.includes(member._id) ? 'bg-mfr-peach/20' : ''}`}>
                  <td className="p-6">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-mfr-border text-mfr-brown focus:ring-mfr-brown shadow-sm cursor-pointer"
                      checked={selectedBuyers.includes(member._id)}
                      onChange={() => toggleSelection(member._id)}
                    />
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-mfr-dark">{member.name}</span>
                      <span className="text-xs text-mfr-muted">{member.email}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-mfr-dark">{member.totalOrders}</span>
                      <span className="text-[9px] font-bold text-mfr-muted uppercase">Orders</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-xs font-black text-mfr-dark">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        ${member.totalSpent?.toLocaleString() || '0'}
                      </div>
                      <span className="text-[9px] text-mfr-muted font-bold ml-4.5">Lifetime spend</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-mfr-dark">
                        <Calendar className="w-3 h-3 text-mfr-muted" />
                        {member.accountAgeMonths}m
                      </div>
                      <span className="text-[9px] text-mfr-muted font-bold uppercase tracking-tighter">Account Age</span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    {member.currentGroup ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-mfr-peach text-mfr-brown border border-mfr-brown/20 uppercase tracking-widest whitespace-nowrap">
                          {member.currentGroup.name}
                        </span>
                        <button 
                          onClick={() => handleRemoveFromGroup(member._id)}
                          className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs italic text-mfr-muted">Unassigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="p-20 text-center text-mfr-muted text-sm italic">
              No buyers matched your current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
