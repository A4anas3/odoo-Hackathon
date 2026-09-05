/**
 * Formats a number as currency (defaults to USD or INR).
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an ISO date string or Date object into a readable date string: '01 Sep 2026'.
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(dateString);
  }
}

/**
 * Formats time as HH:MM AM/PM
 */
export function formatTime(timeString) {
  if (!timeString) return '—';
  try {
    const date = new Date(timeString.includes('T') ? timeString : `1970-01-01T${timeString}`);
    if (isNaN(date.getTime())) return timeString;
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return timeString;
  }
}

/**
 * Calculates hours between check-in and check-out or formats decimal hours as '8h 30m'
 */
export function formatHours(hours) {
  if (hours === null || hours === undefined || isNaN(hours)) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
