const Booking = require("../../models/booking.model");
const Staff = require("../../models/staff.model");
const Service = require("../../models/service.model");
const User = require("../../models/user.model");
const ApiResponse = require("../../utils/ApiResponse");

/**
 * Unified Global Search for Admins
 * Queries across multiple collections and returns grouped results.
 */
const globalSearch = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return new ApiResponse(200, "Search query too short", {
                bookings: [], staff: [], services: [], users: []
            }).send(res);
        }

        const regex = new RegExp(q, "i");

        // Run queries in parallel for performance
        const [bookings, staff, services, users] = await Promise.all([
            // Bookings Search (ID, status, notes)
            Booking.find({
                $or: [
                    { notes: regex },
                    { status: regex }
                ]
            }).limit(5).populate("serviceId staffId userId", "name").lean(),

            // Staff Search (Name, specialization, email)
            Staff.find({
                $or: [
                    { name: regex },
                    { specialization: regex },
                    { email: regex }
                ]
            }).limit(5).lean(),

            // Services Search (Name, category)
            Service.find({
                $or: [
                    { name: regex },
                    { category: regex }
                ]
            }).limit(5).lean(),

            // Users Search (Name, email, phone)
            User.find({
                $or: [
                    { name: regex },
                    { email: regex },
                    { phone: regex }
                ]
            }).limit(5).lean()
        ]);

        return new ApiResponse(200, "Search results fetched", {
            bookings,
            staff,
            services,
            users
        }).send(res);
    } catch (err) {
        next(err);
    }
};

module.exports = { globalSearch };
