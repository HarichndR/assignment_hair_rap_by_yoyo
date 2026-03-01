const User = require("../models/user.model");
const { parsePagination, sanitiseSort, buildMeta } = require("../utils/queryHelpers");


const USER_SORT_FIELDS = new Set(["name", "email", "createdAt"]);


const listUsers = async ({ page, limit, search, sortBy, sortOrder } = {}) => {
    const { page: p, limit: l, skip } = parsePagination(page, limit);
    const sort = sanitiseSort(sortBy, sortOrder, USER_SORT_FIELDS, "createdAt");

    const filter = {};
    if (search?.trim()) {
        const regex = { $regex: search.trim(), $options: "i" };
        filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [users, total] = await Promise.all([
        User.find(filter).sort(sort).skip(skip).limit(l).lean(),
        User.countDocuments(filter),
    ]);

    return { users, meta: buildMeta(p, l, total) };
};

module.exports = { listUsers };
