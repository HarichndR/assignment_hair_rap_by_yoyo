// ─── Roles & Auth ─────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
    CUSTOMER: "customer",
    ADMIN: "admin",
});

const OAUTH_PROVIDERS = Object.freeze({
    GOOGLE: "google",
    FACEBOOK: "facebook",
    LOCAL: "local",
});

// ─── Booking ──────────────────────────────────────────────────────────────────
const BOOKING_STATUS = Object.freeze({
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
});

const CANCELLED_BY = Object.freeze({
    CUSTOMER: "customer",
    ADMIN: "admin",
});

// ─── Slot ─────────────────────────────────────────────────────────────────────
const SLOT_TYPE = Object.freeze({
    AVAILABLE: "available",
    BOOKED: "booked",
    BLOCKED: "blocked",
});

// ─── Pagination ───────────────────────────────────────────────────────────────
const PAGINATION = Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50, // cap at 50 for performance
});

// ─── Allowed sort fields per entity (prevents NoSQL injection via sortBy) ─────
const SORT_FIELDS = Object.freeze({
    SERVICE: new Set(["name", "price", "duration", "createdAt"]),
    STAFF: new Set(["name", "createdAt"]),
    BOOKING: new Set(["date", "createdAt", "startTime"]),
});

const SORT_ORDER = Object.freeze({
    ASC: "asc",
    DESC: "desc",
});

// ─── Time ─────────────────────────────────────────────────────────────────────
const MS = Object.freeze({
    HOUR: 1000 * 60 * 60,
    DAY: 1000 * 60 * 60 * 24,
    WEEK: 1000 * 60 * 60 * 24 * 7,
});

module.exports = {
    ROLES,
    OAUTH_PROVIDERS,
    BOOKING_STATUS,
    CANCELLED_BY,
    SLOT_TYPE,
    PAGINATION,
    SORT_FIELDS,
    SORT_ORDER,
    MS,
};
