
const { PAGINATION, SORT_ORDER } = require("../config/constants");


const parsePagination = (page, limit) => {
    const p = Math.max(1, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
    const l = Math.min(
        Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
    );
    return { page: p, limit: l, skip: (p - 1) * l };
};


const sanitiseSort = (sortBy, sortOrder, allowed, fallback = "createdAt") => {
    const field = allowed.has(sortBy) ? sortBy : fallback;
    const dir = sortOrder === SORT_ORDER.DESC ? -1 : 1;
    return { [field]: dir };
};


const buildMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

module.exports = { parsePagination, sanitiseSort, buildMeta };
