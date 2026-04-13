import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Train, Bus, Package, Search, Bell, HelpCircle, Globe,
  FileText, Barcode, ChevronDown, CheckCircle2, Edit3, Plus,
  MapPin, AlertTriangle, Loader2, Phone, User, Calendar,
  Info, X, ChevronRight, Layers, Clock, RefreshCw, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ── Transport type config ──────────────────────────────────────────────────────
const TRANSPORT_TYPES = [
  { id: 'own_vehicle',        label: 'Own Vehicle',        sub: 'Self transport',       icon: Truck,     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'transport_company',  label: 'Transport Company',  sub: 'Hired Carrier',     icon: Navigation, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'bus_cargo',          label: 'Bus Cargo',          sub: 'GSRTC / MSRTC',     icon: Bus,       color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'train_parcel',       label: 'Train Parcel',       sub: 'Railway Cargo',     icon: Train,     color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'courier',            label: 'Third Party Courier', sub: 'Delhivery / Shiprocket', icon: Package, color: 'bg-rose-100 text-rose-700 border-rose-200' },
] as const;

const STATUS_STEPS = ['Order Placed', 'Confirmed', 'Dispatched', 'In Transit', 'Delivered'];

const STATUS_COLORS: Record<string, string> = {
  Processing: 'bg-slate-100 text-slate-600',
  Packed: 'bg-amber-100 text-amber-700',
  Dispatched: 'bg-blue-100 text-blue-700',
  'In Transit': 'bg-indigo-100 text-indigo-700',
  'Reached Hub': 'bg-purple-100 text-purple-700',
  'Out for Delivery': 'bg-orange-100 text-orange-700',
  Delivered: 'bg-green-100 text-green-700',
  Delayed: 'bg-red-100 text-red-700',
};

const COURIER_NAMES = ['Delhivery', 'Shiprocket', 'DTDC', 'BlueDart', 'Ekart', 'FedEx', 'Other'];

// ── Field component helpers ───────────────────────────────────────────────────
function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase font-bold tracking-widest text-[#A89F91] flex items-center gap-1.5">
        {Icon && <Icon size={11} />} {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, icon: Icon }: any) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A89F91]" size={16} />}
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-[#F5F2ED] border-none rounded-2xl h-12 ${Icon ? 'pl-11' : 'pl-4'} text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0`}
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Shipment() {
  const { user } = useAuth();

  // Page state
  const [shipments, setShipments] = useState<any[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<any[]>([]);
  const [combineGroups, setCombineGroups] = useState<{ city: string; orders: any[] }[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create shipment form state
  const [showForm, setShowForm] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [transportType, setTransportType] = useState<string>('own_vehicle');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // Combine suggestion
  const [combineGroup, setCombineGroup] = useState<{ city: string; orders: any[] } | null>(null);

  // Status update modal
  const [updatingShipment, setUpdatingShipment] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('In Transit');
  const [statusMsg, setStatusMsg] = useState('');
  const [updating, setUpdating] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.getShipments().catch(() => []),
      api.getConfirmedOrders().catch(() => []),
      api.checkCombineOrders().catch(() => ({ groups: [] })),
      api.getShipmentReminders().catch(() => ({ reminders: [] })),
    ]).then(([ships, orders, combine, remind]) => {
      setShipments(Array.isArray(ships) ? ships : []);
      setConfirmedOrders(Array.isArray(orders) ? orders : []);
      setCombineGroups((combine as any)?.groups || []);
      setReminders((remind as any)?.reminders || []);
    }).finally(() => setLoading(false));
  }, []);

  const setField = (key: string, val: string) => setFields(f => ({ ...f, [key]: val }));

  // ── Create shipment ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!selectedOrders.length) return alert('Please select at least one order');
    if (!transportType) return alert('Please select a transport type');
    setCreating(true);
    try {
      const payload = {
        orderIds: selectedOrders,
        transportType,
        ...fields,
      };
      const created = await api.createShipment(payload);
      setShipments(prev => [created, ...prev]);
      // Remove shipped orders from confirmed list
      setConfirmedOrders(prev => prev.filter(o => !selectedOrders.includes(o._id)));
      setShowForm(false);
      setSelectedOrders([]);
      setFields({});
    } catch (err: any) {
      alert(err.message || 'Failed to create shipment');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!updatingShipment) return;
    setUpdating(true);
    try {
      const updated = await api.updateShipmentStatus(updatingShipment._id, {
        status: newStatus,
        message: statusMsg,
      });
      setShipments(prev => prev.map(s => s._id === updated._id ? updated : s));
      setUpdatingShipment(null);
      setStatusMsg('');
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F2ED]">
        <Loader2 className="w-8 h-8 text-[#6B4E3D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F5F2ED]">
      {/* Top Bar */}
      <header className="h-20 flex items-center justify-between px-10 border-b border-[#E5E1DA] bg-[#F5F2ED] shrink-0">
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A89F91]" size={17} />
          <Input
            placeholder="Search shipments..."
            className="pl-12 bg-[#EFE9E1] border-none rounded-full h-11 text-sm placeholder:text-[#A89F91] focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-5">
          <button className="text-[#6B4E3D] hover:opacity-70"><Bell size={20} /></button>
          <button className="text-[#6B4E3D] hover:opacity-70"><HelpCircle size={20} /></button>
          <Separator orientation="vertical" className="h-8 bg-[#E5E1DA]" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-[#1A1A1A]">{user?.name}</p>
              <p className="text-[10px] text-[#A89F91] uppercase tracking-widest font-bold">Manufacturer</p>
            </div>
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-[#6B4E3D] text-white">{user?.name?.[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-7xl mx-auto p-10 space-y-8">

          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-medium text-[#1A1A1A]">
                Shipments <span className="font-serif italic text-[#A89F91]">&amp;</span> Dispatch
              </h1>
              <p className="text-[#A89F91] text-sm mt-1">Manage all your order dispatches from one place</p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-[#6B4E3D] hover:bg-[#5A4133] text-white rounded-full px-6 h-12 font-bold gap-2 shadow-lg shadow-[#6B4E3D]/20"
            >
              <Plus size={18} /> Create Shipment
            </Button>
          </div>

          {/* 24h/48h Reminders */}
          <AnimatePresence>
            {reminders.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-4 p-5 rounded-2xl border ${r.level === '48h' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
              >
                <AlertTriangle size={20} className={r.level === '48h' ? 'text-red-600 shrink-0 mt-0.5' : 'text-amber-600 shrink-0 mt-0.5'} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1A1A1A]">{r.message}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedOrders([r.order._id]);
                    setShowForm(true);
                  }}
                  className="text-xs font-bold bg-[#6B4E3D] text-white px-4 py-2 rounded-full hover:opacity-90"
                >
                  Create Now
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Combine Shipment Suggestion */}
          <AnimatePresence>
            {combineGroups.map((group, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-[#6B4E3D] to-[#8B6353] text-white rounded-3xl p-7 flex items-start gap-5"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Layers size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-lg mb-1">
                    💡 {group.orders.length} orders for {group.city.charAt(0).toUpperCase() + group.city.slice(1)} — Ship together?
                  </p>
                  <p className="text-white/70 text-sm mb-4">Save on logistics by combining these orders into one vehicle dispatch. Each buyer gets their own tracking.</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {group.orders.map((o: any) => (
                      <span key={o._id} className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {o.orderId} · {o.buyer?.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedOrders(group.orders.map((o: any) => o._id));
                        setCombineGroup(group);
                        setShowForm(true);
                      }}
                      className="bg-white text-[#6B4E3D] font-bold px-5 py-2.5 rounded-full text-sm hover:bg-white/90 transition-all"
                    >
                      Combine Shipment
                    </button>
                    <button
                      onClick={() => setCombineGroups(prev => prev.filter((_, j) => j !== i))}
                      className="bg-white/10 text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-white/20"
                    >
                      Send Separately
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Shipments', value: shipments.length, icon: Package, color: 'bg-[#FCE7D6] text-[#6B4E3D]' },
              { label: 'In Transit', value: shipments.filter(s => s.status === 'In Transit' || s.status === 'Dispatched').length, icon: Truck, color: 'bg-blue-100 text-blue-700' },
              { label: 'Pending Dispatch', value: confirmedOrders.length, icon: Clock, color: 'bg-amber-100 text-amber-700' },
              { label: 'Delivered', value: shipments.filter(s => s.status === 'Delivered').length, icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
            ].map(stat => (
              <Card key={stat.label} className="rounded-2xl border border-[#E5E1DA] shadow-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{stat.value}</p>
                    <p className="text-xs text-[#A89F91] font-medium mt-0.5">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Confirmed Orders needing shipment */}
          {confirmedOrders.length > 0 && (
            <Card className="rounded-[28px] border-none shadow-sm">
              <CardHeader className="px-8 pt-8 pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
                  <Clock size={18} className="text-amber-600" /> Confirmed Orders — Awaiting Dispatch
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-700 border-none text-xs font-bold px-3 py-1">
                  {confirmedOrders.length} pending
                </Badge>
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-3">
                {confirmedOrders.map((order: any) => (
                  <div key={order._id} className="flex items-center gap-4 p-4 bg-[#F5F2ED] rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-black text-sm shrink-0">
                      {order.buyer?.initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1A1A1A] text-sm">{order.orderId}</p>
                      <p className="text-xs text-[#A89F91] truncate">{order.buyer?.name} · {order.buyer?.location}</p>
                      <p className="text-xs text-[#A89F91]">{order.items}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedOrders([order._id]); setShowForm(true); }}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#6B4E3D] text-white text-xs font-bold rounded-full hover:bg-[#5A4133] transition-all"
                    >
                      <Plus size={14} /> Create Shipment
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Active Shipments */}
          <Card className="rounded-[28px] border-none shadow-sm">
            <CardHeader className="px-8 pt-8 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black text-[#1A1A1A]">Active Shipments</CardTitle>
              <Badge className="bg-[#FCE7D6] text-[#6B4E3D] border-none text-xs font-bold px-3 py-1">
                {shipments.filter(s => s.status !== 'Delivered').length} in motion
              </Badge>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {shipments.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#E5E1DA] rounded-2xl">
                  <Package className="w-10 h-10 mx-auto mb-2 text-[#A89F91]" />
                  <p className="text-sm text-[#A89F91] font-bold">No shipments yet</p>
                </div>
              ) : shipments.map((s: any) => {
                const TIcon = TRANSPORT_TYPES.find(t => t.id === s.transportType)?.icon || Truck;
                const tColor = TRANSPORT_TYPES.find(t => t.id === s.transportType)?.color || 'bg-slate-100 text-slate-600 border-slate-200';
                return (
                  <div key={s._id} className="bg-[#F5F2ED] rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${tColor} shrink-0`}>
                        <TIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-black text-[#1A1A1A]">{s.shipmentId}</p>
                            <p className="text-xs text-[#A89F91]">
                              {s.orders?.length > 1 ? `${s.orders.length} combined orders` : s.order?.orderId || 'Order'}
                              {s.arrival ? ` · Est. ${s.arrival}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600'}`}>
                              {s.status}
                            </span>
                            <button
                              onClick={() => { setUpdatingShipment(s); setNewStatus('In Transit'); }}
                              className="p-2 bg-white rounded-xl hover:bg-[#6B4E3D] hover:text-white text-[#6B4E3D] transition-all"
                              title="Update status"
                            >
                              <RefreshCw size={15} />
                            </button>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-[9px] font-bold text-[#A89F91] uppercase tracking-widest mb-1.5">
                            <span>Progress</span><span>{s.progress || 10}%</span>
                          </div>
                          <div className="h-1.5 bg-[#E5E1DA] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${s.progress || 10}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-[#6B4E3D] rounded-full"
                            />
                          </div>
                        </div>
                        {/* Transport-specific details */}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#A89F91]">
                          {s.transportType === 'own_vehicle' || s.transportType === 'transport_company' ? (
                            <>
                              {s.driverName && <span className="flex items-center gap-1"><User size={11}/> {s.driverName}</span>}
                              {s.driverPhone && <span className="flex items-center gap-1"><Phone size={11}/> {s.driverPhone}</span>}
                              {s.vehicleNumber && <span className="flex items-center gap-1"><Truck size={11}/> {s.vehicleNumber}</span>}
                            </>
                          ) : s.transportType === 'bus_cargo' ? (
                            <>
                              {s.busServiceName && <span className="flex items-center gap-1"><Bus size={11}/> {s.busServiceName}</span>}
                              {s.parcelReceiptNumber && <span className="flex items-center gap-1"><Barcode size={11}/> {s.parcelReceiptNumber}</span>}
                            </>
                          ) : s.transportType === 'train_parcel' ? (
                            <>
                              {s.trainName && <span className="flex items-center gap-1"><Train size={11}/> {s.trainName} {s.trainNumber}</span>}
                              {s.parcelBookingNumber && <span className="flex items-center gap-1"><FileText size={11}/> {s.parcelBookingNumber}</span>}
                            </>
                          ) : s.transportType === 'courier' ? (
                            <>
                              {s.carrier && <span className="flex items-center gap-1"><Package size={11}/> {s.carrier}</span>}
                              {s.trackingNumber && <span className="flex items-center gap-1"><Barcode size={11}/> {s.trackingNumber}</span>}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* ── CREATE SHIPMENT MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl h-full bg-[#F5F2ED] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-8 pt-8 pb-6 bg-[#6B4E3D] text-white shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-black">Create Shipment</h2>
                  <button onClick={() => setShowForm(false)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-white/70 text-sm">
                  {selectedOrders.length > 1 ? `Combined dispatch for ${selectedOrders.length} orders` : 'Single order dispatch'}
                </p>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-8 space-y-8">

                  {/* Step 1 — Select Orders */}
                  {confirmedOrders.length > 0 && (
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#A89F91] mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 bg-[#6B4E3D] text-white rounded-full text-[10px] flex items-center justify-center font-black">1</span>
                        Select Orders
                      </h3>
                      <div className="space-y-2">
                        {confirmedOrders.map((order: any) => (
                          <button
                            key={order._id}
                            onClick={() => setSelectedOrders(prev =>
                              prev.includes(order._id) ? prev.filter(id => id !== order._id) : [...prev, order._id]
                            )}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                              selectedOrders.includes(order._id)
                                ? 'bg-[#FCE7D6] border-[#6B4E3D]'
                                : 'bg-white border-transparent hover:border-[#E5E1DA]'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selectedOrders.includes(order._id) ? 'bg-[#6B4E3D] border-[#6B4E3D]' : 'border-[#A89F91]'
                            }`}>
                              {selectedOrders.includes(order._id) && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#1A1A1A] text-sm">{order.orderId}</p>
                              <p className="text-xs text-[#A89F91] truncate">{order.buyer?.name} · {order.buyer?.location}</p>
                            </div>
                            <span className="text-xs font-bold text-[#6B4E3D]">{order.value}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Step 2 — Transport Type */}
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#A89F91] mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#6B4E3D] text-white rounded-full text-[10px] flex items-center justify-center font-black">2</span>
                      Transport Type
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                       {TRANSPORT_TYPES.map(t => (
                         <button
                           key={t.id}
                           onClick={() => { 
                             setTransportType(t.id); 
                             setFields({}); 
                             setTimeout(() => {
                               detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                             }, 100);
                           }}
                           className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                            transportType === t.id
                              ? 'bg-[#FCE7D6] border-[#6B4E3D]'
                              : 'bg-white border-transparent hover:border-[#E5E1DA]'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.color} border shrink-0`}>
                            <t.icon size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-[#1A1A1A] text-sm">{t.label}</p>
                            <p className="text-xs text-[#A89F91]">{t.sub}</p>
                          </div>
                          {transportType === t.id && <CheckCircle2 size={18} className="ml-auto text-[#6B4E3D]" />}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Step 3 — Dynamic Fields */}
                  <section ref={detailsRef}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#A89F91] mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#6B4E3D] text-white rounded-full text-[10px] flex items-center justify-center font-black">3</span>
                      Shipment Details
                    </h3>
                    <div className="bg-white rounded-2xl p-6 space-y-5">

                      {/* Own vehicle / Transport company */}
                      {(transportType === 'own_vehicle' || transportType === 'transport_company') && (
                        <>
                          {transportType === 'transport_company' && (
                            <Field label="Transport Company Name" icon={Truck}>
                              <TextInput value={fields.transportCompany || ''} onChange={(v: string) => setField('transportCompany', v)} placeholder="e.g. Sharma Transport" />
                            </Field>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Driver Name" icon={User}>
                              <TextInput value={fields.driverName || ''} onChange={(v: string) => setField('driverName', v)} placeholder="Full name" />
                            </Field>
                            <Field label="Driver Phone" icon={Phone}>
                              <TextInput value={fields.driverPhone || ''} onChange={(v: string) => setField('driverPhone', v)} placeholder="+91 XXXXX XXXXX" />
                            </Field>
                          </div>
                          <Field label="Vehicle Number" icon={Truck}>
                            <TextInput value={fields.vehicleNumber || ''} onChange={(v: string) => setField('vehicleNumber', v)} placeholder="e.g. GJ-01-AB-1234" />
                          </Field>
                        </>
                      )}

                      {/* Bus cargo */}
                      {transportType === 'bus_cargo' && (
                        <>
                          <Field label="Bus Service Name" icon={Bus}>
                            <TextInput value={fields.busServiceName || ''} onChange={(v: string) => setField('busServiceName', v)} placeholder="e.g. GSRTC, MSRTC" />
                          </Field>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Bus / Route Number" icon={FileText}>
                              <TextInput value={fields.busNumber || ''} onChange={(v: string) => setField('busNumber', v)} placeholder="e.g. GJ-14-A" />
                            </Field>
                            <Field label="Parcel Receipt No." icon={Barcode}>
                              <TextInput value={fields.parcelReceiptNumber || ''} onChange={(v: string) => setField('parcelReceiptNumber', v)} placeholder="Receipt no." />
                            </Field>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Departure Bus Stand" icon={MapPin}>
                              <TextInput value={fields.departureBusStand || ''} onChange={(v: string) => setField('departureBusStand', v)} placeholder="Origin stand" />
                            </Field>
                            <Field label="Destination Bus Stand" icon={MapPin}>
                              <TextInput value={fields.destinationBusStand || ''} onChange={(v: string) => setField('destinationBusStand', v)} placeholder="Destination stand" />
                            </Field>
                          </div>
                        </>
                      )}

                      {/* Train parcel */}
                      {transportType === 'train_parcel' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Train Name" icon={Train}>
                              <TextInput value={fields.trainName || ''} onChange={(v: string) => setField('trainName', v)} placeholder="e.g. Rajdhani Express" />
                            </Field>
                            <Field label="Train Number" icon={FileText}>
                              <TextInput value={fields.trainNumber || ''} onChange={(v: string) => setField('trainNumber', v)} placeholder="e.g. 12901" />
                            </Field>
                          </div>
                          <Field label="PNR / Parcel Booking Number" icon={Barcode}>
                            <TextInput value={fields.parcelBookingNumber || ''} onChange={(v: string) => setField('parcelBookingNumber', v)} placeholder="PNR or booking reference" />
                          </Field>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Departure Station" icon={MapPin}>
                              <TextInput value={fields.departureStation || ''} onChange={(v: string) => setField('departureStation', v)} placeholder="Origin station" />
                            </Field>
                            <Field label="Arrival Station" icon={MapPin}>
                              <TextInput value={fields.arrivalStation || ''} onChange={(v: string) => setField('arrivalStation', v)} placeholder="Destination station" />
                            </Field>
                          </div>
                        </>
                      )}

                      {/* Courier */}
                      {transportType === 'courier' && (
                        <>
                          <Field label="Courier Name" icon={Package}>
                            <div className="grid grid-cols-3 gap-2">
                              {COURIER_NAMES.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setField('carrier', c)}
                                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                                    fields.carrier === c
                                      ? 'bg-[#6B4E3D] text-white border-[#6B4E3D]'
                                      : 'bg-[#F5F2ED] text-[#6B4E3D] border-[#E5E1DA] hover:border-[#6B4E3D]'
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </Field>
                          <Field label="Tracking Number" icon={Barcode}>
                            <TextInput value={fields.trackingNumber || ''} onChange={(v: string) => setField('trackingNumber', v)} placeholder="Enter tracking number" />
                          </Field>
                          {fields.carrier && fields.carrier !== 'Other' && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                              <Info size={14} className="text-green-600 shrink-0" />
                              <p className="text-xs text-green-700 font-bold">Live tracking will be pulled automatically from {fields.carrier}</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Common fields */}
                      <Separator className="bg-[#E5E1DA]" />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Dispatch Date &amp; Time" icon={Calendar}>
                          <Input
                            type="datetime-local"
                            value={fields.dispatchDate || ''}
                            onChange={e => setField('dispatchDate', e.target.value)}
                            className="bg-[#F5F2ED] border-none rounded-2xl h-12 px-4 text-sm font-medium focus-visible:ring-0"
                          />
                        </Field>
                        <Field label="Est. Delivery Date" icon={Calendar}>
                          <Input
                            type="date"
                            value={fields.estimatedDelivery || ''}
                            onChange={e => setField('estimatedDelivery', e.target.value)}
                            className="bg-[#F5F2ED] border-none rounded-2xl h-12 px-4 text-sm font-medium focus-visible:ring-0"
                          />
                        </Field>
                      </div>
                      <Field label="Pickup / Origin Location" icon={MapPin}>
                        <TextInput value={fields.pickupLocation || ''} onChange={(v: string) => setField('pickupLocation', v)} placeholder="e.g. Warehouse, Surat" icon={MapPin} />
                      </Field>
                      <Field label="Special Instructions (optional)" icon={Info}>
                        <Input
                          value={fields.specialInstructions || ''}
                          onChange={e => setField('specialInstructions', e.target.value)}
                          placeholder='e.g. "Handle with care", "Keep dry"'
                          className="bg-[#F5F2ED] border-none rounded-2xl h-12 px-4 text-sm font-medium focus-visible:ring-0"
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-[#E5E1DA] bg-[#F5F2ED] shrink-0">
                <Button
                  onClick={handleCreate}
                  disabled={creating || !selectedOrders.length}
                  className="w-full bg-[#6B4E3D] hover:bg-[#5A4133] text-white rounded-full h-14 text-base font-black shadow-lg shadow-[#6B4E3D]/20 gap-2 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight size={20} />}
                  {creating ? 'Creating…' : `Confirm & Dispatch${selectedOrders.length > 1 ? ` (${selectedOrders.length} Orders)` : ''}`}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STATUS UPDATE MODAL ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {updatingShipment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setUpdatingShipment(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black text-[#1A1A1A] mb-6">Update Shipment Status</h3>
              <p className="text-sm text-[#A89F91] font-bold mb-4">{updatingShipment.shipmentId}</p>

              <div className="space-y-2 mb-6">
                {(['In Transit', 'Reached Hub', 'Out for Delivery', 'Delivered'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      newStatus === s ? 'border-[#6B4E3D] bg-[#FCE7D6]' : 'border-[#E5E1DA] hover:border-[#A89F91]'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${newStatus === s ? 'bg-[#6B4E3D]' : 'bg-[#E5E1DA]'}`} />
                    <span className="font-bold text-sm text-[#1A1A1A]">{s}</span>
                  </button>
                ))}
              </div>

              <Input
                value={statusMsg}
                onChange={e => setStatusMsg(e.target.value)}
                placeholder="Optional note (e.g. Reached Surat hub)"
                className="bg-[#F5F2ED] border-none rounded-2xl h-12 px-4 text-sm mb-6 focus-visible:ring-0"
              />

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setUpdatingShipment(null)} className="flex-1 rounded-full h-12 border-[#E5E1DA]">Cancel</Button>
                <Button onClick={handleStatusUpdate} disabled={updating} className="flex-1 bg-[#6B4E3D] hover:bg-[#5A4133] text-white rounded-full h-12 font-bold disabled:opacity-50">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Status'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
