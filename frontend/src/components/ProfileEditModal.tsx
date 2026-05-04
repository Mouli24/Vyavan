import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Phone, Building2, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({ isOpen, onClose }: Props) {
  const { user, setUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await api.updateProfile(formData);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#FAF8F5] p-6 border-b border-[#E5E1DA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5D4037] flex items-center justify-center shadow-lg">
                  <User className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Profile</h2>
                  <p className="text-xs text-slate-500 font-medium">Update your account details</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-[#E5E1DA] flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#5D4037] transition-all"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#5D4037] transition-all"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#5D4037] transition-all"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#5D4037] transition-all"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#5D4037] hover:bg-[#3E2723] text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E1DA] text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A89F91]">
                Vyawan &bull; Secure Profile Management
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
