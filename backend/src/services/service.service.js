const Service = require("../models/service.model");
const ApiError = require("../utils/ApiError");
const { parsePagination, sanitiseSort, buildMeta } = require("../utils/queryHelpers");
const { SORT_FIELDS } = require("../config/constants");

/**
 * List active services with pagination and search.
 */
const listServices = async ({ page, limit, search, category, sortBy, sortOrder } = {}) => {
    const { page: p, limit: l, skip } = parsePagination(page, limit);
    const sort = sanitiseSort(sortBy, sortOrder, SORT_FIELDS.SERVICE, "name");

    const filter = { isActive: true };
    if (category?.trim()) filter.category = category.trim();
    if (search?.trim()) filter.name = { $regex: search.trim(), $options: "i" };

    const [services, total] = await Promise.all([
        Service.find(filter).sort(sort).skip(skip).limit(l).lean(),
        Service.countDocuments(filter),
    ]);

    return { services, meta: buildMeta(p, l, total) };
};

/**
 * Admin: List all services (including inactive) with full filtering.
 */
const adminListServices = async ({ page, limit, search, category, isActive, sortBy, sortOrder } = {}) => {
    const { page: p, limit: l, skip } = parsePagination(page, limit);
    const sort = sanitiseSort(sortBy, sortOrder, SORT_FIELDS.SERVICE, "name");

    const filter = {};
    if (category?.trim()) filter.category = category.trim();
    if (search?.trim()) filter.name = { $regex: search.trim(), $options: "i" };
    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;

    const [services, categories, total] = await Promise.all([
        Service.find(filter).sort(sort).skip(skip).limit(l).lean(),
        Service.distinct("category"),
        Service.countDocuments(filter),
    ]);

    return { services, categories, meta: buildMeta(p, l, total) };
};

/**
 * Fetch a single service by ID.
 */
const getServiceById = async (id) => {
    const service = await Service.findById(id).lean();
    if (!service) throw new ApiError(404, "Service not found");
    return service;
};

/**
 * Create a new salon service.
 */
const createService = async (data) => Service.create(data);

/**
 * Update an existing service.
 */
const updateService = async (id, data) => {
    const service = await Service.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!service) throw new ApiError(404, "Service not found");
    return service;
};

/**
 * Soft-delete a service by deactivating it.
 */
const deleteService = async (id) => {
    const service = await Service.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!service) throw new ApiError(404, "Service not found");
    return service;
};

module.exports = {
    listServices,
    adminListServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};
