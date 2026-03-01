const Staff = require("../models/staff.model");
const Booking = require("../models/booking.model");
const Service = require("../models/service.model");
const ApiError = require("../utils/ApiError");
const { BOOKING_STATUS } = require("../config/constants");

const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h * 60) + m;
};

const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const listSlotsForService = async (serviceId, dateStr) => {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const startOfDay = new Date(dateStr);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const AppSettings = require("../models/settings.model");
    const [service, settings, allEligibleStaff] = await Promise.all([
        Service.findById(serviceId).select("duration isActive").lean(),
        AppSettings.getSingleton(),
        Staff.find({
            services: serviceId,
            isAvailable: true,
            "workingHours.day": dayName,
        }).select("_id name specialization workingHours").lean()
    ]);

    if (!service || !service.isActive) throw new ApiError(404, "Service not found or inactive");
    if (allEligibleStaff.length === 0) return [];

    const globalStart = timeToMinutes(settings.salonStartTime || "09:00");
    const globalEnd = timeToMinutes(settings.salonEndTime || "21:00");
    const duration = service.duration;

    const bookings = await Booking.find({
        staffId: { $in: allEligibleStaff.map(s => s._id) },
        date: { $gte: startOfDay, $lt: endOfDay },
        status: { $ne: BOOKING_STATUS.CANCELLED }
    }).select("staffId startTime endTime").lean();

    const bookingsByStaff = bookings.reduce((acc, b) => {
        const sid = b.staffId.toString();
        if (!acc[sid]) acc[sid] = [];
        acc[sid].push({
            start: timeToMinutes(b.startTime),
            end: timeToMinutes(b.endTime)
        });
        return acc;
    }, {});

    const availableSlots = [];

    for (const staff of allEligibleStaff) {
        const hours = staff.workingHours.find(h => h.day === dayName);
        if (!hours) continue;

        const effectiveStart = Math.max(timeToMinutes(hours.startTime), globalStart);
        const effectiveEnd = Math.min(timeToMinutes(hours.endTime), globalEnd);

        const staffBookings = (bookingsByStaff[staff._id.toString()] || [])
            .sort((a, b) => a.start - b.start);

        for (let current = effectiveStart; current + duration <= effectiveEnd; current += 15) {
            const slotEnd = current + duration;

            const hasCollision = staffBookings.some(b =>
                (current < b.end && slotEnd > b.start)
            );

            if (!hasCollision) {
                availableSlots.push({
                    staffId: {
                        _id: staff._id,
                        name: staff.name,
                        specialization: staff.specialization
                    },
                    date: dateStr,
                    startTime: minutesToTime(current),
                    endTime: minutesToTime(slotEnd),
                    type: "available"
                });
            }
        }
    }

    return availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

const getStaffSlots = async (staffId, dateStr) => {
    const staff = await Staff.findById(staffId).lean();
    if (!staff) throw new ApiError(404, "Staff not found");

    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const hours = staff.workingHours.find(h => h.day === dayName);

    if (!hours) return [];

    const bookings = await Booking.find({
        staffId,
        date: { $gte: new Date(dateStr), $lt: new Date(new Date(dateStr).setDate(date.getDate() + 1)) },
    })
        .populate("serviceId", "name")
        .lean();

    const result = bookings.map(b => ({
        _id: b._id,
        startTime: b.startTime,
        endTime: b.endTime,
        type: b.status === BOOKING_STATUS.CANCELLED ? "cancelled" : "booked",
        serviceName: b.serviceId?.name || "Service"
    }));

    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
};

const createSlot = async () => {
    throw new ApiError(403, "Static slot creation is disabled in Dynamic Slotting mode.");
};

module.exports = { listSlotsForService, getStaffSlots, createSlot };
