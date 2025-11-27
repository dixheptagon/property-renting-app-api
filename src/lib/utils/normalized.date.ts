/**
 * Utility function to normalize dates to Asia/Jakarta timezone (UTC+7)
 * This ensures consistent date handling across the application
 */

export const normalizeTimezone = (date: Date): Date => {
  // Convert UTC date to Jakarta timezone (UTC+7)
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};

export const normalizeDateRange = (
  startDate: Date,
  endDate: Date,
): { start: Date; end: Date } => {
  return {
    start: normalizeTimezone(startDate),
    end: normalizeTimezone(endDate),
  };
};

export const formatDateString = (date: Date): string => {
  const UTCDate = normalizeTimezone(date);
  return UTCDate.toISOString().split('T')[0]; // YYYY-MM-DD format
};
