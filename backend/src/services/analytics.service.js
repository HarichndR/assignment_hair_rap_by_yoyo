const Booking = require("../models/booking.model");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");
const User = require("../models/user.model");
const { BOOKING_STATUS } = require("../config/constants");
const { startOfToday, daysAgo } = require("../utils/dateHelpers");

/**
 * Get core dashboard stats
 */
const getDashboardStats = async () => {
    const today = startOfToday();
    const [
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        todayBookings,
        totalCustomers,
        revenueAgg
    ] = await Promise.all([
        Booking.countDocuments({}),
        Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED }),
        Booking.countDocuments({ status: BOOKING_STATUS.PENDING }),
        Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED }),
        Booking.countDocuments({ date: { $gte: today } }),
        User.countDocuments({ role: "customer" }),
        Booking.aggregate([
            { $match: { status: BOOKING_STATUS.CONFIRMED } },
            { $lookup: { from: "services", localField: "serviceId", foreignField: "_id", as: "service" } },
            { $unwind: "$service" },
            { $group: { _id: null, total: { $sum: "$service.price" } } }
        ])
    ]);

    // Top 5 Services by booking count
    const topServices = await Booking.aggregate([
        { $match: { status: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: "$serviceId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } },
        { $unwind: "$service" },
        { $project: { _id: 0, name: "$service.name", value: "$count" } }
    ]);

    // Top 5 Staff by booking count
    const topStaff = await Booking.aggregate([
        { $match: { status: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: "$staffId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "staffs", localField: "_id", foreignField: "_id", as: "staff" } },
        { $unwind: "$staff" },
        { $project: { _id: 0, name: "$staff.name", value: "$count" } }
    ]);

    return {
        stats: {
            totalBookings,
            confirmedBookings,
            pendingBookings,
            cancelledBookings,
            todayBookings,
            totalCustomers,
            totalRevenue: revenueAgg[0]?.total || 0
        },
        charts: {
            topServices,
            topStaff
        }
    };
};

module.exports = {
    getDashboardStats
};
