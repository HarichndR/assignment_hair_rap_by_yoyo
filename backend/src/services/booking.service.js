const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");
const AppSettings = require("../models/settings.model");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const { parsePagination, sanitiseSort, buildMeta } = require("../utils/queryHelpers");
const { buildDateRangeFilter } = require("../utils/dateHelpers");
const {
    BOOKING_STATUS,
    CANCELLED_BY,
    SLOT_TYPE,
    SORT_FIELDS,
    SORT_ORDER,
    MS,
} = require("../config/constants");

// ─── Create Booking ───────────────────────────────────────────────────────────

/**
 * Helper to convert time string to minutes for comparison.
 */
const timeToMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

/**
 * Professional Booking Logic:
 * Instead of consuming a pre-generated slot, we verify the staff's schedule
 * and existing bookings in real-time before confirming.
 */
const createBooking = async (userId, { serviceId, staffId, date: dateStr, startTime, notes }) => {
    try {
        const [service, staff] = await Promise.all([
            Service.findById(serviceId).lean(),
            Staff.findById(staffId).lean(),
        ]);

        if (!service || !service.isActive) throw new ApiError(404, "Service not found");
        if (!staff || !staff.isAvailable) throw new ApiError(404, "Staff not available");

        // 1. Verify staff performs this service
        const canPerform = staff.services.some((id) => id.toString() === serviceId.toString());
        if (!canPerform) throw new ApiError(400, "Selected staff cannot perform this service");

        // 2. Compute endTime based on service duration
        const startMins = timeToMinutes(startTime);
        const endMins = startMins + service.duration;
        const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

        // 3. Verify working hours (Global Salon Hours + Staff Schedule)
        const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = days[new Date(dateStr).getDay()];

        const settings = await AppSettings.getSingleton();
        const globalStart = timeToMinutes(settings.salonStartTime || "09:00");
        const globalEnd = timeToMinutes(settings.salonEndTime || "21:00");

        const hours = staff.workingHours.find(h => h.day === dayName);
        if (!hours) throw new ApiError(400, `Staff does not work on ${dayName}`);

        const staffStart = timeToMinutes(hours.startTime);
        const staffEnd = timeToMinutes(hours.endTime);

        const effectiveStart = Math.max(staffStart, globalStart);
        const effectiveEnd = Math.min(staffEnd, globalEnd);

        if (startMins < effectiveStart || endMins > effectiveEnd) {
            throw new ApiError(400, "Booking time is outside operational hours (salon or staff schedule)");
        }

        // 4. Collision Check (Real-time overlap detection)
        const overlapping = await Booking.findOne({
            staffId,
            date: dateStr,
            status: { $ne: BOOKING_STATUS.CANCELLED },
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ]
        });

        if (overlapping) {
            throw new ApiError(409, "This time slot was just taken. Please choose another time.");
        }

        // 5. Create the Booking Record
        const booking = await Booking.create({
            userId,
            serviceId,
            staffId,
            date: dateStr,
            startTime,
            endTime,
            notes: notes?.trim(),
            status: BOOKING_STATUS.PENDING,
        });

        logger.info(`Booking created: ${booking._id} | Staff: ${staff.name}`);

        return Booking.findById(booking._id)
            .populate("serviceId", "name duration price")
            .populate("staffId", "name specialization")
            .lean();
    } catch (err) {
        throw err;
    }
};

// ─── Customer Cancel Booking ─────────────────────────────────────────────────
const cancelBooking = async (bookingId, userId, reason) => {
    try {
        const booking = await Booking.findOne({ _id: bookingId, userId });
        if (!booking) throw new ApiError(404, "Booking not found");
        if (booking.status === BOOKING_STATUS.CANCELLED) {
            throw new ApiError(400, "This booking has already been cancelled");
        }

        if (booking.status === BOOKING_STATUS.CONFIRMED) {
            const settings = await AppSettings.getSingleton();
            const bookingDT = new Date(`${booking.date.toISOString().split("T")[0]}T${booking.startTime}:00+05:30`);
            const hoursUntil = (bookingDT.getTime() - Date.now()) / MS.HOUR;

            if (hoursUntil < settings.cancellationWindowHours) {
                throw new ApiError(
                    403,
                    `Cancellations must be made at least ${settings.cancellationWindowHours} hour(s) before the appointment. ` +
                    `Your appointment is in ${Math.round(hoursUntil)} hour(s).`
                );
            }
        }

        booking.status = BOOKING_STATUS.CANCELLED;
        booking.cancelledBy = CANCELLED_BY.CUSTOMER;
        booking.cancellationReason = reason?.trim() || null;
        await booking.save();

        logger.info(`Booking ${bookingId} cancelled by customer ${userId}`);
        return booking;
    } catch (err) {
        throw err;
    }
};

// ─── Get User Bookings (GET /bookings?userId=) ────────────────────────────────
const getUserBookings = async (userId, { page, limit, status, sortBy, sortOrder, fromDate, toDate } = {}) => {
    const { page: p, limit: l, skip } = parsePagination(page, limit);
    const sort = sanitiseSort(sortBy, sortOrder, SORT_FIELDS.BOOKING, "date");

    const filter = { userId };
    if (status && Object.values(BOOKING_STATUS).includes(status)) filter.status = status;

    const dateFilter = buildDateRangeFilter(fromDate, toDate);
    if (dateFilter) filter.date = dateFilter;

    const [bookings, total] = await Promise.all([
        Booking.find(filter)
            .populate("serviceId", "name price category")
            .populate("staffId", "name specialization")
            .sort(sort)
            .skip(skip)
            .limit(l)
            .lean(),
        Booking.countDocuments(filter),
    ]);

    return { bookings, meta: buildMeta(p, l, total) };
};

// ─── Admin: List Bookings ─────────────────────────────────────────────────────
const adminListBookings = async ({ page, limit, status, staffId, serviceId, fromDate, toDate, sortBy, sortOrder } = {}) => {
    const { page: p, limit: l, skip } = parsePagination(page, limit);
    const sort = sanitiseSort(sortBy, sortOrder, SORT_FIELDS.BOOKING, "date");

    const filter = {};
    if (status && Object.values(BOOKING_STATUS).includes(status)) filter.status = status;
    if (staffId) filter.staffId = staffId;
    if (serviceId) filter.serviceId = serviceId;

    const dateFilter = buildDateRangeFilter(fromDate, toDate);
    if (dateFilter) filter.date = dateFilter;

    const sortWithSecondary = { ...sort };
    if (!sortWithSecondary.startTime) sortWithSecondary.startTime = 1;

    const [bookings, total] = await Promise.all([
        Booking.find(filter)
            .populate("userId", "name email phone")
            .populate("serviceId", "name price category")
            .populate("staffId", "name specialization")
            .sort(sortWithSecondary)
            .skip(skip)
            .limit(l)
            .lean(),
        Booking.countDocuments(filter),
    ]);

    return { bookings, meta: buildMeta(p, l, total) };
};

// ─── Admin: Update Booking Status ────────────────────────────────────────────
const adminUpdateBookingStatus = async (bookingId, { status, cancellationReason }) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");
    if (booking.status === status) {
        throw new ApiError(400, `Booking is already "${status}"`);
    }

    booking.status = status;
    if (status === BOOKING_STATUS.CANCELLED) {
        booking.cancelledBy = CANCELLED_BY.ADMIN;
        booking.cancellationReason = cancellationReason?.trim() || null;
    }

    await booking.save();
    logger.info(`Admin updated booking ${bookingId} → ${status}`);
    return booking;
};

/**
 * 🚀 High-performance Stat Summary using a single Aggregation pass
 * Replaces multiple countDocuments calls with a single group-by status query.
 */
const getStatsSummary = async (filter = {}) => {
    const stats = await Booking.aggregate([
        { $match: filter },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    // Map into a clean object with defaults
    const summary = {
        PENDING: 0,
        CONFIRMED: 0,
        CANCELLED: 0,
        COMPLETED: 0,
        total: 0,
    };

    stats.forEach((s) => {
        if (summary[s._id] !== undefined) {
            summary[s._id] = s.count;
            summary.total += s.count;
        }
    });

    return summary;
};

module.exports = {
    createBooking,
    cancelBooking,
    getUserBookings,
    adminListBookings,
    adminUpdateBookingStatus,
    getStatsSummary,
};
