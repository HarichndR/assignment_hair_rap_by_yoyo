const bookingService = require("../../services/booking.service");
const slotService = require("../../services/slot.service");
const ApiResponse = require("../../utils/ApiResponse");

const getAllBookings = async (req, res, next) => {
    try {
        const result = await bookingService.adminListBookings(req.query);
        return new ApiResponse(200, "Bookings fetched", result.bookings, result.meta).send(res);
    } catch (err) { next(err); }
};

const updateBookingStatus = async (req, res, next) => {
    try {
        const booking = await bookingService.adminUpdateBookingStatus(req.params.id, req.body);
        return new ApiResponse(200, "Booking status updated", booking).send(res);
    } catch (err) { next(err); }
};

module.exports = { getAllBookings, updateBookingStatus };
