/**
 * Date Helpers — shared date utilities for queries and AI context fetching.
 *
 * @module utils/dateHelpers
 */

/**
 * Returns a new Date set to the start of today (midnight).
 * Safe — creates a fresh object, no mutation.
 *
 * @returns {Date}
 */
const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Returns a new Date set to N days ago at midnight.
 *
 * @param {number} days
 * @returns {Date}
 */
const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Returns a new Date set to N days in the future at midnight.
 *
 * @param {number} days
 * @returns {Date}
 */
const daysFromNow = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Returns { $gte: from, $lt: to } for a MongoDB date range.
 * to is made exclusive (next day midnight) when toDateStr is provided.
 *
 * @param {string|undefined} fromDateStr - YYYY-MM-DD
 * @param {string|undefined} toDateStr   - YYYY-MM-DD (inclusive)
 * @returns {object|null}  MongoDB $gte/$lt filter, or null if neither provided
 */
const buildDateRangeFilter = (fromDateStr, toDateStr) => {
    if (!fromDateStr && !toDateStr) return null;

    const filter = {};
    if (fromDateStr) {
        const from = new Date(fromDateStr);
        if (!isNaN(from)) filter.$gte = from;
    }
    if (toDateStr) {
        const to = new Date(toDateStr);
        if (!isNaN(to)) {
            to.setDate(to.getDate() + 1); // include the whole toDate day
            filter.$lt = to;
        }
    }
    return Object.keys(filter).length ? filter : null;
};

/**
 * Format a Date to YYYY-MM-DD for display / AI context.
 *
 * @param {Date|string|undefined} date
 * @returns {string}
 */
const toDateString = (date) => {
    if (!date) return "—";
    try { return new Date(date).toISOString().split("T")[0]; }
    catch { return "—"; }
};

module.exports = { startOfToday, daysAgo, daysFromNow, buildDateRangeFilter, toDateString };
