/**
 * Query Helpers — shared pagination and sort utilities
 * Used across booking, service, and staff services.
 *
 * @module utils/queryHelpers
 */
const { PAGINATION, SORT_ORDER } = require("../config/constants");

/**
 * Safely parse page and limit from query params.
 * Guards against NaN, strings, negative values, and over-limit abuse.
 *
 * @param {any} page  - raw page from req.query
 * @param {any} limit - raw limit from req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (page, limit) => {
    const p = Math.max(1, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
    const l = Math.min(
        Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
    );
    return { page: p, limit: l, skip: (p - 1) * l };
};

/**
 * Build a safe MongoDB sort object.
 * Whitelists sortBy against an allowed Set — prevents NoSQL sort-field injection.
 *
 * @param {string}  sortBy    - field name from query param
 * @param {string}  sortOrder - "asc" | "desc"
 * @param {Set}     allowed   - Set of allowed field names (from SORT_FIELDS constant)
 * @param {string}  fallback  - default sort field if sortBy not in allowed
 * @returns {Record<string, 1 | -1>}
 */
const sanitiseSort = (sortBy, sortOrder, allowed, fallback = "createdAt") => {
    const field = allowed.has(sortBy) ? sortBy : fallback;
    const dir = sortOrder === SORT_ORDER.DESC ? -1 : 1;
    return { [field]: dir };
};

/**
 * Build a standard meta object for paginated API responses.
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @returns {{ page, limit, total, totalPages }}
 */
const buildMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

module.exports = { parsePagination, sanitiseSort, buildMeta };
