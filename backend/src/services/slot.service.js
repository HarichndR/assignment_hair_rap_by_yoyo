const Staff = require("../models/staff.model");
const Booking = require("../models/booking.model");
const Service = require("../models/service.model");
const ApiError = require("../utils/ApiError");
const { BOOKING_STATUS } = require("../config/constants");

// ─── Internal Time Helpers ────────────────────────────────────────────────────

/**
 * Converts "HH:MM" string to minutes since midnight for easy math.
 */
const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h * 60) + m;
};

/**
 * Converts minutes back to "HH:MM" format.
 */
const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// ─── Core Service Logic ───────────────────────────────────────────────────────

/**
 * List available slots for a specific service on a given date.
 * This is the "Dynamic Slotting" engine — it calculates slots on-the-fly.
 */
const listSlotsForService = async (serviceId, dateStr) => {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    // 1. Fetch the service (to get its duration)
    const service = await Service.findById(serviceId).lean();
    if (!service || !service.isActive) throw new ApiError(404, "Service not found or inactive");

    // 2. Find all eligible staff who provide this service
    const staffMembers = await Staff.find({
        services: serviceId,
        isAvailable: true,
        "workingHours.day": dayName,
    }).lean();

    if (staffMembers.length === 0) return [];

    // 3. Fetch Salon-wide Business Hours (Simplified Global)
    const AppSettings = require("../models/settings.model");
    const settings = await AppSettings.getSingleton();
    const globalStart = timeToMinutes(settings.salonStartTime || "09:00");
    const globalEnd = timeToMinutes(settings.salonEndTime || "21:00");

    // 4. Get all existing non-cancelled bookings for these staff on this date
    const bookings = await Booking.find({
        staffId: { $in: staffMembers.map(s => s._id) },
        date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).setDate(date.getDate() + 1)) },
        status: { $ne: BOOKING_STATUS.CANCELLED }
    }).lean();

    const availableSlots = [];

    // 5. Calculate slots for each staff member
    for (const staff of staffMembers) {
        const hours = staff.workingHours.find(h => h.day === dayName);
        if (!hours) continue;

        // Intersection logic: Slot must be within staff hours AND global salon hours
        const staffStart = timeToMinutes(hours.startTime);
        const staffEnd = timeToMinutes(hours.endTime);

        const effectiveStart = Math.max(staffStart, globalStart);
        const effectiveEnd = Math.min(staffEnd, globalEnd);
        const duration = service.duration;

        // Fetch bookings for this specific staff member
        const staffBookings = bookings
            .filter(b => String(b.staffId) === String(staff._id))
            .map(b => ({
                start: timeToMinutes(b.startTime),
                end: timeToMinutes(b.endTime)
            }));

        // Slide through the workday in 15-min increments
        for (let current = effectiveStart; current + duration <= effectiveEnd; current += 15) {
            const slotStart = current;
            const slotEnd = current + duration;

            // Check collision with any existing booking
            const isColliding = staffBookings.some(b =>
                (slotStart < b.end && slotEnd > b.start)
            );

            if (!isColliding) {
                availableSlots.push({
                    staffId: {
                        _id: staff._id,
                        name: staff.name,
                        specialization: staff.specialization
                    },
                    date: dateStr,
                    startTime: minutesToTime(slotStart),
                    endTime: minutesToTime(slotEnd),
                    type: "available"
                });
            }
        }
    }

    return availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

/**
 * Get all slots for a staff member (Admin view).
 * Mixes dynamic working hours with actual bookings.
 */
const getStaffSlots = async (staffId, dateStr) => {
    const staff = await Staff.findById(staffId).lean();
    if (!staff) throw new ApiError(404, "Staff not found");

    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const hours = staff.workingHours.find(h => h.day === dayName);

    if (!hours) return [];

    // For simplicity in admin view, we list bookings and empty gaps
    const bookings = await Booking.find({
        staffId,
        date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).setDate(date.getDate() + 1)) },
    })
        .populate("serviceId", "name")
        .lean();

    // Map bookings to "booked" slots
    const result = bookings.map(b => ({
        _id: b._id,
        startTime: b.startTime,
        endTime: b.endTime,
        type: b.status === BOOKING_STATUS.CANCELLED ? "cancelled" : "booked",
        serviceName: b.serviceId?.name || "Service"
    }));

    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

/**
 * Create Slot is no longer used for dynamic slotting (virtual slots).
 * We keep the signature for compatibility but it's effectively a No-Op
 * or can be repurposed for "blocking" time manually.
 */
const createSlot = async () => {
    throw new ApiError(403, "Static slot creation is disabled in Dynamic Slotting mode.");
};

module.exports = { listSlotsForService, getStaffSlots, createSlot };
