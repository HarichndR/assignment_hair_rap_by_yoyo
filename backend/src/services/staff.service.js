const Staff = require("../models/staff.model");
const ApiError = require("../utils/ApiError");
const { parsePagination, sanitiseSort, buildMeta } = require("../utils/queryHelpers");
const { SORT_FIELDS } = require("../config/constants");

/**
 * List staff members.
 * Supports filtering by availability and search terms.
 */
const listStaff = async ({ page, limit, search, isAvailable, sortBy, sortOrder } = {}) => {
    const { page: p, limit: l, skip } = parsePagination(page, limit);
    const sort = sanitiseSort(sortBy, sortOrder, SORT_FIELDS.STAFF, "name");

    const filter = {};
    if (search?.trim()) filter.name = { $regex: search.trim(), $options: "i" };
    if (isAvailable === "true") filter.isAvailable = true;
    if (isAvailable === "false") filter.isAvailable = false;

    const [staff, total] = await Promise.all([
        Staff.find(filter).populate("services", "name category").sort(sort).skip(skip).limit(l).lean(),
        Staff.countDocuments(filter),
    ]);

    return { staff, meta: buildMeta(p, l, total) };
};

/**
 * Create a new staff member.
 */
const createStaffMember = async (data) => {
    const doc = await Staff.create(data);
    return Staff.findById(doc._id).populate("services", "name category").lean();
};

/**
 * Update staff member details.
 */
const updateStaffMember = async (id, data) => {
    const staff = await Staff.findByIdAndUpdate(id, data, { new: true, runValidators: true })
        .populate("services", "name category");
    if (!staff) throw new ApiError(404, "Staff member not found");
    return staff;
};

/**
 * Soft-delete a staff member (mark as unavailable).
 */
const deactivateStaffMember = async (id) => {
    const staff = await Staff.findByIdAndUpdate(id, { isAvailable: false }, { new: true });
    if (!staff) throw new ApiError(404, "Staff member not found");
    return staff;
};

module.exports = {
    listStaff,
    createStaffMember,
    updateStaffMember,
    deactivateStaffMember
};
