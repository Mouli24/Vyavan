import { useState, useEffect } from 'react';
import {
  CalendarDays, ToggleLeft, ToggleRight, Plus, Trash2,
  Save, Loader2, MessageSquare, ArrowRight, CheckCircle2,
  Info, Star, ShoppingBag, Handshake, AlertTriangle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

interface Holiday {
  date: string;
  label: string;
}

interface HolidaySettings {
  weeklyOffDays: number[];
  holidays: Holiday[];
  backInOfficeDate: string;
  autoResponse: string;
  isOnHoliday: boolean;
  showWelcomeBack: boolean;
  holidayStats: {
    ordersReceived: number;
    negotiationsStarted: number;
    complaintsReceived: number;
    holidayStartDate: string;
  };
}

const DEFAULT: HolidaySettings = {
  weeklyOffDays: [],
  holidays: [],
  backInOfficeDate: '',
  autoResponse: 'We are currently closed and will return on [date]. Your request has been saved.',
  isOnHoliday: false,
  showWelcomeBack: false,
  holidayStats: {
    ordersReceived: 0,
    negotiationsStarted: 0,
    complaintsReceived: 0,
    holidayStartDate: '',
  },
};

export default function HolidayCalendar() {
  const [settings, setSettings] = useState<HolidaySettings>(DEFAULT);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [newDate, setNewDate]   = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    api.getHolidaySettings()
      .then(data => setSettings({ ...DEFAULT, ...data, holidayStats: { ...DEFAULT.holidayStats, ...(data.holidayStats ?? {}) } }))
      .catch(() => {/* profile may not exist yet, use defaults */})
      .finally(() => setLoading(false));
  }, []);

  const toggleWeeklyDay = (day: number) => {
    setSettings(s => ({
      ...s,
      weeklyOffDays: s.weeklyOffDays.includes(day)
        ? s.weeklyOffDays.filter(d => d !== day)
        : [...s.weeklyOffDays, day],
    }));
  };

  const addHoliday = () => {
    if (!newDate) return;
    if (settings.holidays.some(h => h.date === newDate)) return;
    setSettings(s => ({
      ...s,
      holidays: [...s.holidays, { date: newDate, label: newLabel || 'Holiday' }],
    }));
    setNewDate('');
    setNewLabel('');
  };

  const removeHoliday = (date: string) => {
    setSettings(s => ({ ...s, holidays: s.holidays.filter(h => h.date !== date) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.saveHolidaySettings({
        weeklyOffDays: settings.weeklyOffDays,
        holidays: settings.holidays,
        backInOfficeDate: settings.backInOfficeDate,
        autoResponse: settings.autoResponse,
        isOnHoliday: settings.isOnHoliday,
      });
      setSettings(s => ({ ...s, ...updated, holidayStats: { ...s.holidayStats, ...(updated.holidayStats ?? {}) } }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDismissWelcome = async () => {
    setDismissing(true);
    try {
      await api.dismissWelcomeBack();
      setSettings(s => ({ ...s, showWelcomeBack: false }));
    } catch (e) { console.error(e); }
    finally { setDismissing(false); }
  };

  const toggleHoliday = () => {
    setSettings(s => ({ ...s, isOnHoliday: !s.isOnHoliday }));
  };

  // Format auto-response preview replacing [date] with backInOfficeDate
  const previewMsg = settings.autoResponse.replace(
    '[date]',
    settings.backInOfficeDate
      ? new Date(settings.backInOfficeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '[date]'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-mfr-brown" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Welcome Back Banner ── */}
      <AnimatePresence>
        {settings.showWelcomeBack && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="relative rounded-[2rem] overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8"
          >
            <button
              onClick={handleDismissWelcome}
              disabled={dismissing}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
            >
              {dismissing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                <Star size={22} className="text-white fill-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-emerald-900">Welcome Back! 🎉</h3>
                <p className="text-sm text-emerald-700 font-medium">
                  Here's what happened while you were away
                  {settings.holidayStats.holidayStartDate && ` (since ${new Date(settings.holidayStats.holidayStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: ShoppingBag,  label: 'New Orders',       value: settings.holidayStats.ordersReceived,      color: 'bg-blue-100 text-blue-700' },
                { icon: Handshake,    label: 'Negotiations',      value: settings.holidayStats.negotiationsStarted, color: 'bg-purple-100 text-purple-700' },
                { icon: AlertTriangle,label: 'Complaints',        value: settings.holidayStats.complaintsReceived,  color: 'bg-orange-100 text-orange-700' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/80 rounded-2xl p-5 text-center border border-white">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon size={18} />
                  </div>
                  <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-emerald-700 font-bold">
              All orders have been queued. Dismiss this banner when you're ready to start processing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Holiday Toggle ── */}
      <div className="bg-white rounded-[2rem] border border-mfr-border p-8 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all ${settings.isOnHoliday ? 'bg-red-500' : 'bg-emerald-500'}`}>
              <CalendarDays size={22} className="text-white" />
            </div>
            <div>
              <p className="font-black text-mfr-dark text-lg">Holiday Mode</p>
              <p className="text-sm text-mfr-muted font-medium">
                {settings.isOnHoliday
                  ? 'You are currently on holiday. Buyers receive your auto-response.'
                  : 'You are available. Toggle to activate holiday mode.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleHoliday}
            className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
            title={settings.isOnHoliday ? 'Click to go back online' : 'Click to activate holiday mode'}
          >
            {settings.isOnHoliday
              ? <ToggleRight size={52} className="text-red-500" />
              : <ToggleLeft  size={52} className="text-slate-300" />}
          </button>
        </div>

        {settings.isOnHoliday && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 rounded-2xl bg-red-50 border border-red-100 px-6 py-4 flex items-start gap-3"
          >
            <Info size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              Holiday mode is <strong>ON</strong>. All incoming orders will be accepted automatically but confirmation timelines are extended.
              No call slots will appear for buyers on this period. The auto-response below will be sent to all inquiries.
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Weekly Off Days ── */}
      <div className="bg-white rounded-[2rem] border border-mfr-border p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-mfr-brown-pale flex items-center justify-center">
            <CalendarDays size={18} className="text-mfr-brown" />
          </div>
          <div>
            <h3 className="font-black text-mfr-dark">Weekly Recurring Off Days</h3>
            <p className="text-xs text-mfr-muted font-medium">Select which days of the week your factory is closed every week</p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {DAYS.map(day => {
            const active = settings.weeklyOffDays.includes(day.value);
            return (
              <button
                key={day.value}
                onClick={() => toggleWeeklyDay(day.value)}
                className={`w-16 h-16 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 border-2 ${
                  active
                    ? 'bg-mfr-brown text-white border-mfr-border shadow-lg shadow-mfr-brown/20'
                    : 'bg-mfr-bg text-mfr-muted border-transparent hover:border-mfr-border/30'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        {settings.weeklyOffDays.length > 0 && (
          <p className="mt-4 text-xs font-bold text-mfr-muted">
            Off every: {settings.weeklyOffDays.sort().map(d => DAYS.find(x => x.value === d)?.label).join(', ')}
          </p>
        )}
      </div>

      {/* ── Specific Holiday Dates ── */}
      <div className="bg-white rounded-[2rem] border border-mfr-border p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <CalendarDays size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-mfr-dark">Specific Holiday Dates</h3>
            <p className="text-xs text-mfr-muted font-medium">Add Diwali, factory maintenance, or any specific closure dates</p>
          </div>
        </div>

        {/* Add date input */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-mfr-muted uppercase tracking-widest pl-1">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-12 rounded-2xl border border-mfr-border bg-mfr-bg/30 px-4 text-sm font-bold text-mfr-dark focus:outline-none focus:border-mfr-border focus:bg-white transition-all"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-mfr-muted uppercase tracking-widest pl-1">Label (optional)</label>
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Diwali, Maintenance..."
              className="w-full h-12 rounded-2xl border border-mfr-border bg-mfr-bg/30 px-4 text-sm font-bold text-mfr-dark placeholder:text-mfr-muted focus:outline-none focus:border-mfr-border focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addHoliday}
              disabled={!newDate}
              className="h-12 px-5 rounded-2xl bg-mfr-brown text-white font-black text-sm flex items-center gap-2 hover:bg-mfr-brown-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Holiday list */}
        {settings.holidays.length === 0 ? (
          <div className="rounded-2xl bg-mfr-bg/50 border border-dashed border-mfr-border py-8 text-center">
            <CalendarDays size={28} className="mx-auto text-mfr-muted opacity-40 mb-2" />
            <p className="text-sm font-bold text-mfr-muted">No specific dates added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {settings.holidays
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(h => (
                <motion.div
                  key={h.date}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-amber-50 border border-amber-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📅</span>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {h.label && <p className="text-xs text-amber-700 font-medium">{h.label}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeHoliday(h.date)}
                    className="w-8 h-8 rounded-full bg-white border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* ── Back In Office Date ── */}
      <div className="bg-white rounded-[2rem] border border-mfr-border p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <ArrowRight size={18} className="text-mfr-brown" />
          </div>
          <div>
            <h3 className="font-black text-mfr-dark">Back In Office Date</h3>
            <p className="text-xs text-mfr-muted font-medium">Buyers will see this as your expected return date</p>
          </div>
        </div>
        <input
          type="date"
          value={settings.backInOfficeDate}
          onChange={e => setSettings(s => ({ ...s, backInOfficeDate: e.target.value }))}
          className="h-12 rounded-2xl border border-mfr-border bg-mfr-bg/30 px-4 text-sm font-bold text-mfr-dark focus:outline-none focus:border-mfr-border focus:bg-white transition-all w-full max-w-xs"
        />
      </div>

      {/* ── Auto Response Message ── */}
      <div className="bg-white rounded-[2rem] border border-mfr-border p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <MessageSquare size={18} className="text-mfr-brown" />
          </div>
          <div>
            <h3 className="font-black text-mfr-dark">Auto-Response Message</h3>
            <p className="text-xs text-mfr-muted font-medium">
              Sent automatically to buyers when they contact you during holidays. Use <code className="bg-mfr-bg px-1 rounded text-mfr-brown">[date]</code> to insert your Back In Office date.
            </p>
          </div>
        </div>

        <textarea
          value={settings.autoResponse}
          onChange={e => setSettings(s => ({ ...s, autoResponse: e.target.value }))}
          rows={3}
          className="w-full rounded-2xl border border-mfr-border bg-mfr-bg/20 p-5 text-sm font-bold text-mfr-dark focus:outline-none focus:border-mfr-border focus:bg-white transition-all resize-none"
        />

        {/* Preview */}
        <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-5">
          <p className="text-[10px] font-black text-mfr-muted uppercase tracking-widest mb-2">Preview</p>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-mfr-brown flex items-center justify-center flex-shrink-0">
              <MessageSquare size={13} className="text-white" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100 max-w-sm">
              <p className="text-sm text-slate-700 font-medium">{previewMsg}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 h-12 rounded-[1.5rem] bg-mfr-brown text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-mfr-brown/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle2 size={16} /> Saved!</>
          ) : (
            <><Save size={16} /> Save Holiday Settings</>
          )}
        </button>
      </div>
    </div>
  );
}

