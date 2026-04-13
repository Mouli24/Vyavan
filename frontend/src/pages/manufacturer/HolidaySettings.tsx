import HolidayCalendar from './HolidayCalendar';

export default function HolidaySettings() {
  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Holiday & Availability</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your factory closures, recurring off days, and buyer auto-responses.
        </p>
      </div>
      <HolidayCalendar />
    </div>
  );
}
