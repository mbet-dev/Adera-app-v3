const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const toMinutes = (timeString) => {
  if (typeof timeString !== 'string') return null;
  const [hour = '0', minute = '0'] = timeString.split(':');
  const hoursNum = parseInt(hour, 10);
  const minutesNum = parseInt(minute, 10);
  if (Number.isNaN(hoursNum) || Number.isNaN(minutesNum)) return null;
  return hoursNum * 60 + minutesNum;
};

const formatMinutes = (minutes, locale = 'en-US') => {
  if (minutes == null) return null;
  const date = new Date();
  date.setHours(0, minutes, 0, 0);
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const normalizeEntry = (entry) => {
  if (!entry) return [];

  if (typeof entry === 'string') {
    if (entry.toLowerCase() === 'closed') return [];
    const [start, end] = entry.split('-');
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    if (startMinutes == null || endMinutes == null) return [];
    return [{ start: startMinutes, end: endMinutes }];
  }

  if (Array.isArray(entry)) {
    return entry.flatMap(normalizeEntry);
  }

  if (typeof entry === 'object') {
    const startMinutes = toMinutes(entry.start || entry.open);
    const endMinutes = toMinutes(entry.end || entry.close || entry.closed);
    if (startMinutes == null || endMinutes == null) return [];
    return [{ start: startMinutes, end: endMinutes }];
  }

  return [];
};

export const getOperatingStatus = (operatingHours = {}, now = new Date()) => {
  if (!now || !(now instanceof Date)) now = new Date();
  const locale = undefined;
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayKey = DAY_KEYS.includes(weekday) ? weekday : 'monday';
  const todayIndex = DAY_KEYS.indexOf(todayKey);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayRanges = normalizeEntry(operatingHours[todayKey]);
  const activeRange = todayRanges.find(({ start, end }) => currentMinutes >= start && currentMinutes <= end);

  const isOpen = Boolean(activeRange);
  let label = 'Hours unavailable';
  let nextOpening = null;

  if (isOpen && activeRange) {
    const closeTime = formatMinutes(activeRange.end, locale) || '';
    label = closeTime ? `Open until ${closeTime}` : 'Open now';
  } else {
    const upcomingToday = todayRanges.find(({ start }) => start > currentMinutes);
    if (upcomingToday) {
      label = `Opens today at ${formatMinutes(upcomingToday.start, locale)}`;
      nextOpening = { dayKey: todayKey, minutes: upcomingToday.start };
    } else {
      for (let offset = 1; offset <= 7; offset += 1) {
        const nextDayKey = DAY_KEYS[(todayIndex + offset) % DAY_KEYS.length];
        const ranges = normalizeEntry(operatingHours[nextDayKey]);
        if (ranges.length) {
          label = `Opens ${DAY_LABELS[nextDayKey]} at ${formatMinutes(ranges[0].start, locale)}`;
          nextOpening = { dayKey: nextDayKey, minutes: ranges[0].start };
          break;
        }
      }
      if (!nextOpening) {
        label = 'Closed';
      }
    }
  }

  return {
    isOpen,
    label,
    nextOpening,
    todayKey,
  };
};
