import { useState, useEffect } from 'react';
import {
  Truck, MapPin, Package, Calendar, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Phone, User, Bus, Train,
  Barcode, ExternalLink, Navigation, Info, X, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import BuyerNavbar from '@/components/layout/BuyerNavbar';

// ── Progress steps ────────────────────────────────────────────────────────────
const ORDER_STEPS = ['Order Placed', 'Confirmed', 'Dispatched', 'In Transit', 'Delivered'];

function stepIndexFromStatus(status: string) {
  const map: Record<string, number> = {
    Processing: 1, Packed: 1, Dispatched: 2, 'In Transit': 3,
    'Reached Hub': 3, 'Out for Delivery': 3, Delivered: 4, Delayed: 2,
  };
  return map[status] ?? 1;
}

// ── Icon for transport type ───────────────────────────────────────────────────
function TransportIcon({ type }: { type: string }) {
  const map: Record<string, any> = {
    own_vehicle: Truck,
    transport_company: Navigation,
    bus_cargo: Bus,
    train_parcel: Train,
    courier: Package,
  };
  const Icon = map[type] || Truck;
  return <Icon size={20} />;
}

function transportLabel(type: string) {
  const map: Record<string, string> = {
    own_vehicle: 'Own Vehicle',
    transport_company: 'Transport Company',
    bus_cargo: 'Bus Cargo',
    train_parcel: 'Train Parcel',
    courier: 'Courier',
  };
  return map[type] || type;
}

function transportColor(type: string) {
  const map: Record<string, string> = {
    own_vehicle: 'bg-amber-100 text-amber-700',
    transport_company: 'bg-[#FCE7D6] text-[#5D4037]',
    bus_cargo: 'bg-green-100 text-green-700',
    train_parcel: 'bg-[#F5F2ED] text-[#6B4E3D]',
    courier: 'bg-rose-100 text-rose-700',
  };
  return map[type] || 'bg-slate-100 text-slate-600';
}

// ── Transport-specific detail rows ────────────────────────────────────────────
function ShipmentDetails({ s }: { s: any }) {
  const type = s.transportType;
  const Row = ({ icon: Icon, label, value, href }: any) =>
    value ? (
      <div className="flex items-center gap-3 py-3 border-b border-[#E5E1DA] last:border-0">
        <div className="w-8 h-8 bg-[#FAF8F5] rounded-lg flex items-center justify-center shrink-0">
          <Icon size={14} className="text-[#5D4037]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-[#A89F91] uppercase tracking-widest">{label}</p>
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-sm font-bold text-[#5D4037] hover:underline flex items-center gap-1">
              {value} <ExternalLink size={11} />
            </a>
          ) : (
            <p className="text-sm font-bold text-[#1A1A1A] truncate">{value}</p>
          )}
        </div>
      </div>
    ) : null;

  if (type === 'own_vehicle' || type === 'transport_company') return (
    <div>
      <p className="text-xs font-black text-[#A89F91] uppercase tracking-widest mb-3">
        {type === 'transport_company' ? 'Transport Details' : 'Vehicle Details'}
      </p>
      {type === 'transport_company' && <Row icon={Truck} label="Transport Company" value={s.transportCompany} />}
      <Row icon={User} label="Driver Name" value={s.driverName} />
      <Row icon={Phone} label="Driver Phone" value={s.driverPhone} href={`tel:${s.driverPhone}`} />
      <Row icon={Truck} label="Vehicle Number" value={s.vehicleNumber} />
      <Row icon={Calendar} label="Dispatched On" value={s.dispatchDate ? new Date(s.dispatchDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null} />
      <Row icon={Calendar} label="Estimated Delivery" value={s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : s.arrival} />
    </div>
  );

  if (type === 'bus_cargo') return (
    <div>
      <p className="text-xs font-black text-[#A89F91] uppercase tracking-widest mb-3">Bus Cargo Details</p>
      <Row icon={Bus} label="Bus Service" value={s.busServiceName} />
      <Row icon={Info} label="Bus / Route No." value={s.busNumber} />
      <Row icon={Barcode} label="Parcel Receipt No." value={s.parcelReceiptNumber} />
      <Row icon={MapPin} label="Departing From" value={s.departureBusStand} />
      <Row icon={MapPin} label="Arriving At" value={s.destinationBusStand} />
      <Row icon={Calendar} label="Estimated Arrival" value={s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : s.arrival} />
    </div>
  );

  if (type === 'train_parcel') return (
    <div>
      <p className="text-xs font-black text-[#A89F91] uppercase tracking-widest mb-3">Train Parcel Details</p>
      <Row icon={Train} label="Train Name" value={`${s.trainName || ''} ${s.trainNumber ? `(${s.trainNumber})` : ''}`.trim()} />
      <Row icon={Barcode} label="PNR / Parcel Booking No." value={s.parcelBookingNumber} />
      <Row icon={MapPin} label="Departure Station" value={s.departureStation} />
      <Row icon={MapPin} label="Arrival Station" value={s.arrivalStation} />
      <Row icon={Calendar} label="Estimated Arrival" value={s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : s.arrival} />
    </div>
  );

  if (type === 'courier') return (
    <div>
      <p className="text-xs font-black text-[#A89F91] uppercase tracking-widest mb-3">Courier Details</p>
      <Row icon={Package} label="Courier" value={s.carrier} />
      <Row icon={Barcode} label="Tracking Number" value={s.trackingNumber}
        href={s.trackingUrl || undefined} />
      {s.trackingUrl && (
        <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#5D4037] text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
          <ExternalLink size={13} /> Track on {s.carrier} Website
        </a>
      )}
      <Row icon={Calendar} label="Estimated Delivery" value={s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : s.arrival} />
    </div>
  );

  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BuyerShipments() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeShipment, setActiveShipment] = useState<any | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.getMyShipments()
      .then(setShipments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openTracking = (shipment: any) => {
    setActiveShipment(shipment);
    setTrackingEvents([]);
    setTrackingLoading(true);
    api.getShipmentTracking(shipment._id)
      .then(setTrackingEvents)
      .catch(() => setTrackingEvents([]))
      .finally(() => setTrackingLoading(false));
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setConfirming(true);
    try {
      await api.updateOrderStatus(orderId, 'Delivered');
      setShipments(prev => prev.map(s => {
        const orders = s.orders || (s.order ? [s.order] : []);
        if (orders.some((o: any) => (o._id || o) === orderId)) {
          return { ...s, status: 'Delivered', progress: 100 };
        }
        return s;
      }));
      setActiveShipment(null);
    } catch (e: any) {
      alert(e.message || 'Failed to confirm');
    } finally {
      setConfirming(false);
    }
  };

  const filtered = shipments.filter(s => {
    if (filter === 'transit') return !['Delivered', 'Processing', 'Packed'].includes(s.status);
    if (filter === 'delivered') return s.status === 'Delivered';
    return true;
  });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 text-[#5D4037] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <BuyerNavbar activePage="tracking" />

      <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tight">
            Track <span className="text-[#5D4037]">Shipments</span>
          </h1>
          <p className="text-[#A89F91] font-bold uppercase text-[10px] tracking-widest mt-1">Real-time logistics monitoring</p>
        </div>
        <div className="flex gap-2">
          {['all', 'transit', 'delivered'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-[#5D4037] text-white' : 'bg-[#FAF8F5] text-[#A89F91] hover:bg-[#FCE7D6] hover:text-[#5D4037]'
              }`}
            >
              {f === 'all' ? `All (${shipments.length})` : f === 'transit' ? 'In Transit' : 'Delivered'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-[#FAF8F5] rounded-[2.5rem] py-20 text-center border-2 border-dashed border-[#E5E1DA]">
          <Truck className="w-12 h-12 mx-auto mb-4 text-sp-border" />
          <p className="font-black text-[#1A1A1A]">No shipments found</p>
          <p className="text-xs text-[#A89F91] mt-1 uppercase font-bold tracking-widest max-w-xs mx-auto">
            Once your orders are dispatched, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(s => {
              const stepIdx = stepIndexFromStatus(s.status);
              const relOrders = s.orders?.length ? s.orders : (s.order ? [s.order] : []);
              return (
                <motion.div
                  key={s._id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  onClick={() => openTracking(s)}
                  className="bg-white rounded-[2.5rem] p-8 border border-[#E5E1DA] shadow-sm hover:shadow-hover transition-all group cursor-pointer"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${transportColor(s.transportType)}`}>
                        <TransportIcon type={s.transportType} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[#1A1A1A]">{s.shipmentId}</h3>
                        <p className="text-xs font-bold text-[#A89F91] uppercase tracking-widest mt-0.5">
                          {transportLabel(s.transportType)}
                          {relOrders.length > 1 && ` · ${relOrders.length} combined orders`}
                        </p>
                        {relOrders.map((o: any) => (
                          <span key={o._id || o} className="inline-block mr-2 mt-1 text-[10px] font-bold bg-[#FAF8F5] text-[#1A1A1A] px-2 py-0.5 rounded-full">
                            {o.orderId || o}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border-none ${
                        s.status === 'Delivered' ? 'bg-sp-mint text-sp-success' :
                        s.status === 'Delayed' ? 'bg-red-100 text-red-600' :
                        'bg-[#FCE7D6] text-[#5D4037]'
                      }`}>
                        {s.status}
                      </Badge>
                      <button className="w-10 h-10 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#A89F91] group-hover:bg-[#5D4037] group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Visual progress steps */}
                  <div className="relative flex items-center justify-between mb-6">
                    <div className="absolute left-0 right-0 top-4 h-0.5 bg-[#E5E1DA] -z-0" />
                    <div
                      className="absolute left-0 top-4 h-0.5 bg-[#5D4037] -z-0 transition-all duration-700"
                      style={{ width: `${(stepIdx / (ORDER_STEPS.length - 1)) * 100}%` }}
                    />
                    {ORDER_STEPS.map((step, i) => (
                      <div key={step} className="flex flex-col items-center gap-2 z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          i < stepIdx ? 'bg-[#5D4037] border-[#5D4037]' :
                          i === stepIdx ? 'bg-[#5D4037] border-[#5D4037] ring-4 ring-[#5D4037]/20' :
                          'bg-white border-[#E5E1DA]'
                        }`}>
                          {i < stepIdx ? (
                            <CheckCircle2 size={14} className="text-white" />
                          ) : (
                            <div className={`w-2.5 h-2.5 rounded-full ${i === stepIdx ? 'bg-white' : 'bg-sp-border'}`} />
                          )}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                          i <= stepIdx ? 'text-[#5D4037]' : 'text-[#A89F91]'
                        }`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Quick info chips */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    {s.arrival && (
                      <span className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-full font-bold text-[#1A1A1A]">
                        <Calendar size={12} className="text-[#5D4037]" /> {s.arrival}
                      </span>
                    )}
                    {(s.transportType === 'own_vehicle' || s.transportType === 'transport_company') && s.driverPhone && (
                      <span className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-full font-bold text-[#1A1A1A]">
                        <Phone size={12} className="text-[#5D4037]" /> {s.driverPhone}
                      </span>
                    )}
                    {s.transportType === 'bus_cargo' && s.parcelReceiptNumber && (
                      <span className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-full font-bold text-[#1A1A1A]">
                        <Barcode size={12} className="text-[#5D4037]" /> {s.parcelReceiptNumber}
                      </span>
                    )}
                    {s.transportType === 'train_parcel' && s.parcelBookingNumber && (
                      <span className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-full font-bold text-[#1A1A1A]">
                        <Barcode size={12} className="text-[#5D4037]" /> {s.parcelBookingNumber}
                      </span>
                    )}
                    {s.transportType === 'courier' && s.trackingNumber && (
                      <span className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-full font-bold text-[#1A1A1A]">
                        <Package size={12} className="text-[#5D4037]" /> {s.carrier} · {s.trackingNumber}
                      </span>
                    )}
                    {s.specialInstructions && (
                      <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-bold">
                        <AlertCircle size={12} /> {s.specialInstructions}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── TRACKING DETAIL MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeShipment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setActiveShipment(null)}
          >
            <motion.div
              initial={{ y: '100%', scale: 1 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full sm:rounded-[2rem] sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#E5E1DA] flex justify-between items-start shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${transportColor(activeShipment.transportType)}`}>
                    <TransportIcon type={activeShipment.transportType} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-[#1A1A1A]">{activeShipment.shipmentId}</h3>
                    <p className="text-xs text-[#A89F91] font-bold uppercase tracking-widest">
                      {transportLabel(activeShipment.transportType)} · {activeShipment.status}
                    </p>
                  </div>
                </div>
                <button onClick={() => setActiveShipment(null)} className="w-9 h-9 bg-[#FAF8F5] rounded-full flex items-center justify-center text-[#A89F91] hover:text-[#1A1A1A]">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Transport-specific details */}
                <div className="bg-[#FAF8F5] rounded-2xl p-5">
                  <ShipmentDetails s={activeShipment} />
                </div>

                {/* Tracking Timeline */}
                <div>
                  <h4 className="text-xs font-black text-[#A89F91] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={13} /> Live Updates
                  </h4>
                  {trackingLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-7 h-7 animate-spin text-[#5D4037]" />
                    </div>
                  ) : trackingEvents.length === 0 ? (
                    <p className="text-center text-[#A89F91] py-8 font-bold tracking-widest uppercase text-xs">No carrier updates yet.</p>
                  ) : (
                    <div className="relative border-l-2 border-[#5D4037]/20 ml-3 space-y-6 pb-2">
                      {trackingEvents.map((ev: any, i: number) => (
                        <div key={i} className="relative pl-7">
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${i === 0 ? 'bg-[#5D4037]' : 'bg-[#E5E1DA]'}`} />
                          <p className="font-black text-[#1A1A1A] text-sm mb-0.5 uppercase tracking-wide">{ev.status}</p>
                          <p className="text-xs text-[#A89F91] mb-1.5">{ev.message}</p>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-[#A89F91] uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar size={11}/> {new Date(ev.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {ev.location && <span className="flex items-center gap-1"><MapPin size={11}/> {ev.location}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Delivery */}
                {activeShipment.status !== 'Delivered' && (
                  <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#E5E1DA]">
                    <p className="text-sm font-black text-[#1A1A1A] mb-1">Received your order?</p>
                    <p className="text-xs text-[#A89F91] mb-4">Confirm delivery to let the manufacturer know and release payment.</p>
                    <button
                      onClick={() => {
                        const orderId = activeShipment.orders?.[0]?._id || activeShipment.order?._id || activeShipment.order;
                        if (orderId) handleConfirmDelivery(orderId);
                      }}
                      disabled={confirming}
                      className="w-full py-3 rounded-xl bg-[#5D4037] hover:bg-[#4E342E] text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                    >
                      {confirming ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      {confirming ? 'Confirming…' : 'I Received My Order ✓'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}

