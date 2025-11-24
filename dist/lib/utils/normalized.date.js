/**
 * Utility function to normalize dates to Asia/Jakarta timezone (UTC+7)
 * This ensures consistent date handling across the application
 */
export const normalizeTimezone = (date) => {
    // Convert UTC date to Jakarta timezone (UTC+7)
    return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};
export const normalizeDateRange = (startDate, endDate) => {
    return {
        start: normalizeTimezone(startDate),
        end: normalizeTimezone(endDate),
    };
};
export const formatDateString = (date) => {
    const UTCDate = normalizeTimezone(date);
    return UTCDate.toISOString().split('T')[0]; // YYYY-MM-DD format
};
