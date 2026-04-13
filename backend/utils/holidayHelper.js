import ManufacturerProfile from '../models/ManufacturerProfile.js';
import Notification from '../models/Notification.js';

/**
 * Checks if a manufacturer is currently off based on:
 * 1. Holiday Mode Toggle (isOnHoliday)
 * 2. Weekly Recurring Off Days
 * 3. Specific Holiday Dates
 */
export async function isManufacturerOff(manufacturerId, date = new Date()) {
  const profile = await ManufacturerProfile.findOne({ user: manufacturerId }).select('holidaySettings');
  if (!profile || !profile.holidaySettings) return { isOff: false };

  const hs = profile.holidaySettings;
  const todayStr = date.toISOString().split('T')[0];
  const dow = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  const isWeeklyOff = (hs.weeklyOffDays || []).includes(dow);
  const isSpecificHoliday = (hs.holidays || []).some(h => h.date === todayStr);
  const effectivelyOff = hs.isOnHoliday || isWeeklyOff || isSpecificHoliday;

  return {
    isOff: effectivelyOff,
    settings: hs
  };
}

/**
 * Increments holiday stats and sends auto-response if manufacturer is off.
 */
export async function handleHolidayAutomation(manufacturerId, buyerId, type) {
  const { isOff, settings } = await isManufacturerOff(manufacturerId);
  if (!isOff) return null;

  // Increment stats
  const fieldMap = {
    order: 'ordersReceived',
    negotiation: 'negotiationsStarted',
    complaint: 'complaintsReceived'
  };

  const field = fieldMap[type];
  if (field) {
    await ManufacturerProfile.findOneAndUpdate(
      { user: manufacturerId },
      { $inc: { [`holidaySettings.holidayStats.${field}`]: 1 } }
    );
  }

  // Generate auto-response message
  const returnDate = settings.backInOfficeDate 
    ? new Date(settings.backInOfficeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
    : '[date]';
    
  const message = (settings.autoResponse || '').replace('[date]', returnDate);

  // Send notification to buyer as auto-response
  await Notification.create({
    user: buyerId,
    type: 'holiday_auto_response',
    title: 'Manufacturer is Away',
    message: message,
    link: `/company/${manufacturerId}`
  });

  return { isOff: true, message };
}
