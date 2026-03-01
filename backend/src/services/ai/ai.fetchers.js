/**
 * AI Fetchers — Reliable data retrieval from MongoDB for AI context.
 * 
 * Includes fixes for "No data found" by ensuring lookups don't drop
 * records with missing or mismatched IDs.
 */

const Booking = require("../../models/booking.model");
const Service = require("../../models/service.model");
const Staff = require("../../models/staff.model");
const User = require("../../models/user.model");
const { BOOKING_STATUS } = require("../../config/constants");
const { startOfToday, daysAgo, daysFromNow, toDateString } = require("../../utils/dateHelpers");

// ─── Aggregation Pipeline Helpers ──────────────────────────────────────────────
/**
 * Generic lookup helper that handles both direct field and _id (from groups)
 * @param {string} localField - The field containing the ID
 * @param {string} from - The collection to look up from
 * @param {string} as - The output field name
 */
const lookupHelper = (localField, from, as) => [
    { $addFields: { tempIdObj: { $toObjectId: `$${localField}` } } },
    { $lookup: { from, localField: "tempIdObj", foreignField: "_id", as } },
    { $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true } }
];

const serviceLookup = lookupHelper("serviceId", "services", "service");
const staffLookup = lookupHelper("staffId", "staffs", "staff");
const userLookup = lookupHelper("userId", "users", "user");

// Special lookups for after-grouping stages where the ID is in _id
const serviceLookupGroup = lookupHelper("_id", "services", "service");
const staffLookupGroup = lookupHelper("_id", "staffs", "staff");

const CONTEXT_FETCHERS = {

    // ── Dashboard AI Trend Summary ───────────────────────────────────────────
    dashboard_trend_summary: async (days = 3) => {
        const startDate = daysAgo(days);
        const [bookings, revenueAgg, newCustomers, topServices, topStaff] = await Promise.all([
            Booking.countDocuments({ date: { $gte: startDate } }),
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED, date: { $gte: startDate } } },
                ...serviceLookup,
                { $group: { _id: null, total: { $sum: { $ifNull: ["$service.price", 0] } } } }
            ]),
            User.countDocuments({ createdAt: { $gte: startDate } }),
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED, date: { $gte: startDate } } },
                { $group: { _id: "$serviceId", count: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$service.price", 0] } } } },
                { $sort: { revenue: -1 } }, { $limit: 3 },
                ...serviceLookupGroup,
                { $project: { _id: 0, name: "$service.name", revenue: 1, bookings: "$count" } }
            ]),
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED, date: { $gte: startDate } } },
                { $group: { _id: "$staffId", count: { $sum: 1 } } },
                { $sort: { count: -1 } }, { $limit: 3 },
                ...staffLookupGroup,
                { $project: { _id: 0, name: "$staff.name", bookings: "$count" } }
            ])
        ]);

        return {
            period: `Last ${days} days`,
            totalBookings: bookings,
            estimatedRevenue: revenueAgg[0]?.total || 0,
            newCustomers: newCustomers,
            topServicesPerformance: topServices,
            topStaffPerformance: topStaff
        };
    },

    // ── Dashboard AI JSON Analytics ─────────────────────────────────────────
    dashboard_analytics_json: async () => {
        const [topServices, topStaff] = await Promise.all([
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED } },
                { $group: { _id: "$serviceId", revenue: { $sum: 1 } } },
                { $sort: { revenue: -1 } }, { $limit: 5 },
                ...serviceLookupGroup,
                { $project: { _id: 0, name: { $ifNull: ["$service.name", "Unknown Service"] }, value: "$revenue" } }
            ]),
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED } },
                { $group: { _id: "$staffId", bookings: { $sum: 1 } } },
                { $sort: { bookings: -1 } }, { $limit: 5 },
                ...staffLookupGroup,
                { $project: { _id: 0, name: { $ifNull: ["$staff.name", "Unknown Staff"] }, value: "$bookings" } }
            ])
        ]);

        return {
            instruction: "Return ONLY a JSON object with two keys: 'topServices' and 'topStaff'.",
            topServices,
            topStaff
        };
    },

    // ── Revenue total ──────────────────────────────────────────────────────────
    revenue: async () => {
        const weekStart = daysAgo(7);
        const [thisWeek, allTime] = await Promise.all([
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED, date: { $gte: weekStart } } },
                ...serviceLookup,
                { $group: { _id: null, total: { $sum: { $ifNull: ["$service.price", 0] } }, count: { $sum: 1 } } },
                { $project: { _id: 0, total: 1, count: 1 } },
            ]),
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED } },
                ...serviceLookup,
                { $group: { _id: null, total: { $sum: { $ifNull: ["$service.price", 0] } }, count: { $sum: 1 } } },
                { $project: { _id: 0, total: 1, count: 1 } },
            ]),
        ]);
        return {
            thisWeekRevenue: thisWeek[0] || { total: 0, count: 0 },
            allTimeRevenue: allTime[0] || { total: 0, count: 0 },
            period: `${toDateString(weekStart)} to ${toDateString(new Date())}`,
        };
    },

    // ── Revenue breakdown by category ───────────────────────────────────────────
    revenue_breakdown: () =>
        Booking.aggregate([
            { $match: { status: BOOKING_STATUS.CONFIRMED } },
            ...serviceLookup,
            {
                $group: {
                    _id: { $ifNull: ["$service.category", "Uncategorized"] },
                    revenue: { $sum: { $ifNull: ["$service.price", 0] } },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $project: { _id: 0, category: "$_id", revenue: 1, bookings: 1 } },
        ]),

    // ── Cancellation rate ────────────────────────────────────────────────────────
    cancellation_rate: async () => {
        const [total, cancelled] = await Promise.all([
            Booking.countDocuments({}),
            Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED }),
        ]);
        const rate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0;
        return { totalBookings: total, cancelledBookings: cancelled, cancellationRate: `${rate}%` };
    },

    // ── Last 10 cancelled bookings ────────────────────────────────────────────
    list_cancelled: () =>
        Booking.find({ status: BOOKING_STATUS.CANCELLED })
            .sort({ updatedAt: -1 }).limit(10)
            .populate("serviceId", "name").populate("userId", "name phone").lean()
            .then((docs) => docs.map((b) => ({
                customer: b.userId?.name || "—",
                phone: b.userId?.phone || "—",
                service: b.serviceId?.name || "—",
                date: toDateString(b.date),
                reason: b.cancellationReason || "No reason given",
                cancelledBy: b.cancelledBy,
            }))),

    // ── Upcoming 7 days ──────────────────────────────────────────────────────
    upcoming_bookings: async () => {
        const today = startOfToday();
        const next7 = daysFromNow(7);
        const bookings = await Booking.find({
            status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
            date: { $gte: today, $lt: next7 },
        })
            .populate("serviceId", "name price").populate("staffId", "name").populate("userId", "name")
            .sort({ date: 1, startTime: 1 }).limit(20).lean();

        return bookings.map((b) => ({
            customer: b.userId?.name || "—",
            service: b.serviceId?.name || "—",
            staff: b.staffId?.name || "—",
            date: toDateString(b.date),
            time: b.startTime,
            status: b.status,
        }));
    },

    // ── Top 5 staff by bookings ───────────────────────────────────────────
    top_staff: () =>
        Booking.aggregate([
            { $match: { status: { $ne: BOOKING_STATUS.CANCELLED } } },
            { $group: { _id: "$staffId", totalBookings: { $sum: 1 } } },
            { $sort: { totalBookings: -1 } }, { $limit: 5 },
            ...staffLookupGroup,
            { $project: { _id: 0, staffName: { $ifNull: ["$staff.name", "Unknown"] }, totalBookings: 1 } },
        ]),

    // ── Staff performance ──────────────────────────────────────────────────
    staff_performance: () =>
        Booking.aggregate([
            { $match: { status: BOOKING_STATUS.CONFIRMED } },
            ...serviceLookup,
            {
                $group: {
                    _id: "$staffId",
                    bookings: { $sum: 1 },
                    revenue: { $sum: { $ifNull: ["$service.price", 0] } },
                },
            },
            { $sort: { revenue: -1 } },
            ...staffLookupGroup,
            { $project: { _id: 0, staffName: { $ifNull: ["$staff.name", "Unknown"] }, bookings: 1, revenue: 1 } },
        ]),

    // ── Staff working today ─────────────────────────────────────────────────
    staff_today: async () => {
        const today = startOfToday();
        const tomorrow = daysFromNow(1);
        return Booking.aggregate([
            { $match: { date: { $gte: today, $lt: tomorrow } } },
            { $group: { _id: "$staffId", slots: { $sum: 1 } } },
            ...staffLookupGroup,
            { $project: { _id: 0, name: { $ifNull: ["$staff.name", "Unknown"] }, slots: 1 } },
        ]);
    },

    // ── Top 5 most-booked services ───────────────────────────────────────────
    top_services: () =>
        Booking.aggregate([
            { $match: { status: { $ne: BOOKING_STATUS.CANCELLED } } },
            { $group: { _id: "$serviceId", totalBookings: { $sum: 1 } } },
            { $sort: { totalBookings: -1 } }, { $limit: 5 },
            ...serviceLookupGroup,
            { $project: { _id: 0, serviceName: { $ifNull: ["$service.name", "Unknown"] }, totalBookings: 1 } },
        ]),

    // ── Least-booked services ────────────────────────────────
    least_booked: async () => {
        const stats = await Booking.aggregate([
            { $group: { _id: "$serviceId", count: { $sum: 1 } } },
            { $sort: { count: 1 } }, { $limit: 10 },
            ...serviceLookupGroup,
            { $project: { _id: 0, name: { $ifNull: ["$service.name", "Unknown"] }, bookings: "$count" } }
        ]);
        return stats;
    },

    // ── Time-based stats ──────────────────────────────────────────────────────────
    stats_today: () => {
        const today = startOfToday();
        return Booking.aggregate([
            { $match: { date: { $gte: today, $lt: daysFromNow(1) } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } },
        ]);
    },

    stats_week: () =>
        Booking.aggregate([
            { $match: { date: { $gte: daysAgo(7) } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } },
        ]),

    stats_month: () =>
        Booking.aggregate([
            { $match: { date: { $gte: daysAgo(30) } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } },
        ]),

    // ── Pending approvals ─────────────────────────────────────────────────────
    pending_approvals: () =>
        Booking.find({ status: BOOKING_STATUS.PENDING })
            .sort({ createdAt: 1 }).limit(20)
            .populate("serviceId", "name price").populate("staffId", "name").populate("userId", "name phone")
            .lean()
            .then((docs) => docs.map((b) => ({
                customer: b.userId?.name || "—",
                service: b.serviceId?.name || "—",
                staff: b.staffId?.name || "—",
                date: toDateString(b.date),
                time: b.startTime,
            }))),

    // ── General overview ──────────────────────────────────────────
    general_stats: async () => {
        const [statusCounts, serviceCount, staffCount] = await Promise.all([
            Booking.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { status: "$_id", count: 1, _id: 0 } },
            ]),
            Service.countDocuments({ isActive: true }),
            Staff.countDocuments({ isAvailable: true }),
        ]);
        return { bookingsByStatus: statusCounts, activeServices: serviceCount, activeStaff: staffCount };
    },

    // ── Image Fetchers ──────────────────────────────────────────────
    staff_images: async () => {
        const staff = await Staff.find({ isAvailable: true }).select("name images").lean();
        return staff.map(s => ({ name: s.name, imageCount: (s.images || []).length }));
    },

    service_images: async () => {
        const services = await Service.find({ isActive: true }).select("name images").lean();
        return services.map(s => ({ name: s.name, imageCount: (s.images || []).length }));
    },

    user_images: async () => {
        const users = await User.find({ "image.url": { $exists: true } }).select("name image").limit(10).lean();
        return users.map(u => ({ name: u.name, profileImage: u.image?.url || null }));
    },

    // ── Booking Assistant Context ──────────────────────────────────────────
    book_appointment: async () => {
        const [services, staff, users] = await Promise.all([
            Service.find({ isActive: true }).select("name duration").lean(),
            Staff.find({ isAvailable: true }).select("name specialization").lean(),
            User.find().sort({ createdAt: -1 }).limit(10).select("name email phone").lean()
        ]);
        return {
            availableServices: services.map(s => ({ name: s.name, duration: s.duration, id: s._id })),
            availableStaff: staff.map(s => ({ name: s.name, specialization: s.specialization, id: s._id })),
            recentCustomers: users.map(u => ({ name: u.name, id: u._id, contact: u.phone || u.email })),
            today: toDateString(startOfToday()),
        };
    },
};

module.exports = { CONTEXT_FETCHERS };
