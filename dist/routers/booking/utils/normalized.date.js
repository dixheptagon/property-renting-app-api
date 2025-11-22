"use strict";
/**
 * Utility function to normalize dates to Asia/Jakarta timezone (UTC+7)
 * This ensures consistent date handling across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateString = exports.normalizeDateRange = exports.normalizeTimezone = void 0;
const normalizeTimezone = (date) => {
    // Convert UTC date to Jakarta timezone (UTC+7)
    return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};
exports.normalizeTimezone = normalizeTimezone;
const normalizeDateRange = (startDate, endDate) => {
    return {
        start: (0, exports.normalizeTimezone)(startDate),
        end: (0, exports.normalizeTimezone)(endDate),
    };
};
exports.normalizeDateRange = normalizeDateRange;
const formatDateString = (date) => {
    const jakartaDate = (0, exports.normalizeTimezone)(date);
    return jakartaDate.toISOString().split('T')[0]; // YYYY-MM-DD format
};
exports.formatDateString = formatDateString;
