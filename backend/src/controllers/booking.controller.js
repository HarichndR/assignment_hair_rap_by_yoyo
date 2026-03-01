const bookingService = require("../services/booking.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");


const createBooking = async (req, res, next) => {
    try {
        const userId = req.body.userId;
        const booking = await bookingService.createBooking(userId, req.body);
        return new ApiResponse(201, "Booking created successfully", booking).send(res);
    } catch (err) { next(err); }
};


const getMyBookings = async (req, res, next) => {
    try {
        const userId = req.query.userId;
        const result = await bookingService.getUserBookings(userId, req.query);
        return new ApiResponse(200, "Bookings fetched", result.bookings, result.meta).send(res);
    } catch (err) { next(err); }
};


const cancelBooking = async (req, res, next) => {
    try {
        const userId = req.body.userId;
        const booking = await bookingService.cancelBooking(
            req.params.id,
            userId,
            req.body.cancellationReason
        );
        return new ApiResponse(200, "Booking cancelled", booking).send(res);
    } catch (err) { next(err); }
};

module.exports = { createBooking, getMyBookings, cancelBooking };
