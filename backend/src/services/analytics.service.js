const Booking = require("../models/booking.model");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");
const User = require("../models/user.model");
const { BOOKING_STATUS } = require("../config/constants");
const { startOfToday, daysAgo } = require("../utils/dateHelpers");


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


    const topServices = await Booking.aggregate([
        { $match: { status: BOOKING_STATUS.CONFIRMED } },
        { $group: { _id: "$serviceId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } },
        { $unwind: "$service" },
        { $project: { _id: 0, name: "$service.name", value: "$count" } }
    ]);


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


const getRevenueTrend = async () => {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - 11);
    monthsAgo.setDate(1);

    const trend = await Booking.aggregate([
        {
            $match: {
                status: BOOKING_STATUS.CONFIRMED,
                createdAt: { $gte: monthsAgo }
            }
        },
        {
            $lookup: {
                from: "services",
                localField: "serviceId",
                foreignField: "_id",
                as: "service"
            }
        },
        { $unwind: "$service" },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                revenue: { $sum: "$service.price" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);


    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return trend.map(t => ({
        name: `${monthNames[t._id.month - 1]} ${t._id.year.toString().slice(-2)}`,
        value: t.revenue
    }));
};


const getRecentActivities = async () => {
    const activities = await Booking.find()
        .sort({ createdAt: -1 })
        .limit(15)
        .populate("userId", "name")
        .populate("serviceId", "name");

    return activities.map(a => ({
        id: a._id,
        user: a.userId?.name || "Guest",
        service: a.serviceId?.name || "Service",
        status: a.status,
        at: a.createdAt
    }));
};

const getDashboardStatsWithExtras = async () => {
    const base = await getDashboardStats();
    const [revenueTrend, recentActivities] = await Promise.all([
        getRevenueTrend(),
        getRecentActivities()
    ]);

    return {
        ...base,
        charts: {
            ...base.charts,
            revenueTrend
        },
        recentActivities
    };
};

module.exports = {
    getDashboardStats: getDashboardStatsWithExtras
};
