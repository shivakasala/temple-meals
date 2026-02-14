// All timestamps are stored in UTC.
// For 4 PM cutoff, we assume temple local timezone is configured via env (IANA name),
// defaulting to Asia/Kolkata if not set.

const TEMPLE_TZ = process.env.TEMPLE_TZ || 'Asia/Kolkata';

export const nowUtc = () => new Date();

export const calcEditableUntil = (createdAtUtc) => {
  return new Date(createdAtUtc.getTime() + 10 * 60 * 1000);
};

// Returns true if current UTC time is before or at editableUntil AND mealStatus is 'requested'
export const isEditable = (mealDoc) => {
  const now = nowUtc();
  return mealDoc.mealStatus === 'requested' && now <= mealDoc.editableUntil;
};

// Compute whether we are past today 16:00 in temple local time.
// Uses Intl API; if not available, falls back to simple offset-less comparison (UTC 10:30 ~ 16:00 IST).
export const isPastCutoffForNextDay = () => {
  const now = new Date();

  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: TEMPLE_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = fmt.formatToParts(now);
    const get = (type) => parts.find((p) => p.type === type)?.value;
    const year = Number(get('year'));
    const month = Number(get('month'));
    const day = Number(get('day'));
    const hour = Number(get('hour'));
    const minute = Number(get('minute'));

    // build temple-local 16:00 time
    const templeMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const cutoffLocalMs = templeMidnight.getTime() + 16 * 60 * 60 * 1000;
    const cutoffLocal = new Date(cutoffLocalMs);

    return now.getTime() > cutoffLocal.getTime();
  } catch {
    // Fallback: treat cutoff as 10:30 UTC which corresponds to 16:00 IST
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    if (utcHour > 10) return true;
    if (utcHour === 10 && utcMinute > 30) return true;
    return false;
  }
};

// Helper to get next-day date string in temple local date representation (YYYY-MM-DD)
export const nextDayLocalDateString = () => {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TEMPLE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // today's local date
  const parts = fmt.formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  const todayLocal = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const tomorrowLocal = new Date(todayLocal.getTime() + 24 * 60 * 60 * 1000);
  return fmt.format(tomorrowLocal); // still YYYY-MM-DD in en-CA
};

