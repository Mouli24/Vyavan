import { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Settings, 
  Globe, 
  ShieldCheck, 
  Bell, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2, 
  Camera,
  Briefcase,
  CalendarDays
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import HolidayCalendar from './HolidayCalendar';

export default function ManufacturerSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    about: ''
  });

  useEffect(() => {
    api.getMyManufacturerProfile().then(res => {
      setProfile(res);
      setFormData({
        company: res.company || user?.company || '',
        name: user?.name || '',
        email: user?.email || '',
        phone: res.profile?.contact?.phone || '',
        location: res.profile?.address?.city || '',
        about: res.profile?.description || ''
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, we'd have a specific update profile endpoint.
      // Assuming api.updateManufacturerProfile or general update user profile logic.
      // For now, simulating with a delay as per plan.
      await new Promise(r => setTimeout(r, 1000));
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-mfr-brown animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-mfr-dark tracking-tight">Atelier <span className="text-mfr-brown">Settings</span></h1>
          <p className="text-mfr-muted font-bold uppercase text-[10px] tracking-widest mt-1">Manage your business profile and preferences</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-mfr-brown hover:bg-mfr-brown-hover text-white rounded-[1.5rem] px-8 h-12 font-black uppercase tracking-widest shadow-xl shadow-mfr-brown/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />} Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Sidebar Tabs */}
        <div className="col-span-3 space-y-2">
          {[
            { id: 'profile',  label: 'Company Profile',    icon: Building2 },
            { id: 'account',  label: 'Account Settings',   icon: User },
            { id: 'holiday',  label: 'Holiday Calendar',   icon: CalendarDays },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security',           icon: Lock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-mfr-brown shadow-sm border border-mfr-border' : 'text-mfr-muted hover:bg-mfr-bg'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Content */}
        <div className="col-span-9 space-y-8">

          {/* Holiday Calendar tab */}
          {activeTab === 'holiday' && (
            <HolidayCalendar />
          )}

          {/* Profile tab */}
          {activeTab === 'profile' && (<>
          {/* Profile Header Card */}
          <div className="bg-white rounded-[2.5rem] border border-mfr-border p-10 shadow-card flex items-center gap-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-mfr-brown-pale rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            
            <div className="relative group shrink-0">
              <div className="w-32 h-32 rounded-[2.5rem] bg-mfr-bg border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-mfr-brown text-3xl font-black">
                {formData.company?.[0] || 'A'}
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center border border-mfr-border text-mfr-muted hover:text-mfr-brown hover:scale-110 transition-all">
                <Camera size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-mfr-dark">{formData.company || 'New Atelier'}</h2>
                <Badge className="bg-sp-mint text-sp-success border-none px-3 py-1 rounded-lg font-black uppercase text-[9px] flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified Manufacturer
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-mfr-muted tracking-tight">
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {formData.location || 'India'}</span>
                <span className="flex items-center gap-1.5"><Mail size={14} /> {formData.email}</span>
                <span className="flex items-center gap-1.5"><Building2 size={14} /> ID: {profile?.code || 'MFR-889'}</span>
              </div>
            </div>
          </div>

          {/* Detailed Info Form */}
          <div className="bg-white rounded-[2.5rem] border border-mfr-border p-10 shadow-card space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-mfr-muted uppercase tracking-widest pl-1">Official Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-mfr-muted" size={18} />
                  <Input 
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    className="h-14 rounded-2xl border-mfr-border bg-mfr-bg/20 pl-12 font-bold focus:bg-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-mfr-muted uppercase tracking-widest pl-1">Contact Representative</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-mfr-muted" size={18} />
                  <Input 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-14 rounded-2xl border-mfr-border bg-mfr-bg/20 pl-12 font-bold focus:bg-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-mfr-muted uppercase tracking-widest pl-1">Business Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-mfr-muted" size={18} />
                  <Input 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="h-14 rounded-2xl border-mfr-border bg-mfr-bg/20 pl-12 font-bold focus:bg-white" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-mfr-muted uppercase tracking-widest pl-1">Primary Category</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-mfr-muted" size={18} />
                  <Input 
                    defaultValue="Textile Manufacturing" 
                    className="h-14 rounded-2xl border-mfr-border bg-mfr-bg/20 pl-12 font-bold focus:bg-white" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-mfr-muted uppercase tracking-widest pl-1">Atelier Description</label>
              <textarea 
                value={formData.about}
                onChange={e => setFormData({...formData, about: e.target.value})}
                placeholder="Tell buyers about your manufacturing capacity, history, and craft..."
                className="w-full h-32 rounded-3xl border border-mfr-border bg-mfr-bg/20 p-6 text-sm font-bold focus:bg-white focus:border-mfr-border outline-none resize-none transition-all"
              />
            </div>
            
            <Separator className="bg-mfr-bg" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-mfr-dark">Public Availability Status</p>
                <p className="text-xs text-mfr-muted font-bold">Show current capacity to accept new bulk orders.</p>
              </div>
              <div className="flex items-center gap-2 bg-mfr-bg p-1.5 rounded-full">
                <button className="px-5 py-2 bg-white rounded-full text-[10px] font-black uppercase text-sp-success shadow-sm">Accepting Orders</button>
                <button className="px-5 py-2 rounded-full text-[10px] font-black uppercase text-mfr-muted hover:text-mfr-dark transition-all">Fully Booked</button>
              </div>
            </div>
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
}


