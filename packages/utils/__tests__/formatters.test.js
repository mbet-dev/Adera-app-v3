import {
  formatETB,
  formatDate,
  formatRelativeTime,
  formatTime,
  formatEthiopianPhone,
  truncateAddress,
  formatTrackingId,
  formatDistance,
  formatWeight,
} from '../src/formatters';

describe('formatETB', () => {
  it('formats a number as ETB currency', () => {
    expect(formatETB(1500)).toBe('ETB 1,500.00');
  });

  it('handles zero', () => {
    expect(formatETB(0)).toBe('ETB 0.00');
  });

  it('handles string input', () => {
    expect(formatETB('250.5')).toBe('ETB 250.50');
  });

  it('handles NaN', () => {
    expect(formatETB(NaN)).toBe('ETB 0.00');
  });

  it('handles null/undefined', () => {
    expect(formatETB(null)).toBe('ETB 0.00');
    expect(formatETB(undefined)).toBe('ETB 0.00');
  });

  it('respects decimals option', () => {
    expect(formatETB(1500, { decimals: 0 })).toBe('ETB 1,500');
  });

  it('hides symbol when showSymbol is false', () => {
    expect(formatETB(1500, { showSymbol: false })).toBe('1,500.00');
  });
});

describe('formatDate', () => {
  it('returns empty string for null/empty input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('formats medium date by default', () => {
    const result = formatDate('2025-10-15T12:00:00Z');
    expect(result).toMatch(/Oct/);
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/1[45]/);
  });

  it('formats short date', () => {
    const result = formatDate('2025-10-15T12:00:00Z', { format: 'short' });
    expect(result).toMatch(/Oct/);
    expect(result).not.toMatch(/2025/);
  });

  it('formats long date', () => {
    const result = formatDate('2025-10-15T12:00:00Z', { format: 'long' });
    expect(result).toMatch(/October/);
    expect(result).toMatch(/2025/);
  });
});

describe('formatRelativeTime', () => {
  it('returns empty string for null/empty input', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatRelativeTime('not-a-date')).toBe('');
  });

  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago for timestamps within the hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = formatRelativeTime(fiveMinAgo);
    expect(result).toMatch(/m ago/);
  });

  it('returns hours ago for timestamps within the day', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(threeHoursAgo);
    expect(result).toMatch(/h ago/);
  });

  it('returns days ago for timestamps within a week', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(twoDaysAgo);
    expect(result).toMatch(/d ago/);
  });
});

describe('formatEthiopianPhone', () => {
  it('returns empty string for null/empty input', () => {
    expect(formatEthiopianPhone(null)).toBe('');
    expect(formatEthiopianPhone('')).toBe('');
  });

  it('formats +251 number', () => {
    expect(formatEthiopianPhone('+251911234567')).toBe('+251 911 234 567');
  });

  it('formats 09XX number', () => {
    expect(formatEthiopianPhone('0911234567')).toBe('091 123 4567');
  });

  it('returns original for unrecognized format', () => {
    expect(formatEthiopianPhone('123')).toBe('123');
  });
});

describe('truncateAddress', () => {
  it('returns empty string for null/empty input', () => {
    expect(truncateAddress(null)).toBe('');
    expect(truncateAddress('')).toBe('');
  });

  it('returns full address if within limit', () => {
    expect(truncateAddress('Bole, Addis Ababa')).toBe('Bole, Addis Ababa');
  });

  it('truncates long address with ellipsis', () => {
    const long = 'A very long address in Bole area of Addis Ababa, Ethiopia';
    const result = truncateAddress(long, 30);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(result).toContain('...');
  });
});

describe('formatTrackingId', () => {
  it('returns uppercase tracking ID', () => {
    expect(formatTrackingId('ade-20251015-abc1')).toBe('ADE-20251015-ABC1');
  });

  it('returns empty string for null/empty input', () => {
    expect(formatTrackingId(null)).toBe('');
    expect(formatTrackingId('')).toBe('');
  });
});

describe('formatDistance', () => {
  it('formats meters for distances under 1km', () => {
    expect(formatDistance(0.5)).toBe('500m');
  });

  it('formats kilometers for distances 1km+', () => {
    expect(formatDistance(12.3)).toBe('12.3 km');
  });

  it('returns null for null/undefined', () => {
    expect(formatDistance(null)).toBeNull();
    expect(formatDistance(undefined)).toBeNull();
  });
});

describe('formatWeight', () => {
  it('formats weight in kg', () => {
    expect(formatWeight(2.5)).toBe('2.5 kg');
  });

  it('returns empty string for null/undefined', () => {
    expect(formatWeight(null)).toBe('');
    expect(formatWeight(undefined)).toBe('');
  });
});
