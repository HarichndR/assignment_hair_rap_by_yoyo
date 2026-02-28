const express = require("express");
const bookingController = require("../controllers/booking.controller");
const validate = require("../middlewares/validate");
const limiter = require("../middlewares/rateLimiter");
const { createBookingSchema, cancelBookingSchema } = require("../validations/booking.validation");

const router = express.Router();

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new appointment booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, serviceId, staffId, slotId]
 *             properties:
 *               userId: { type: string }
 *               serviceId: { type: string }
 *               staffId: { type: string }
 *               slotId: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Booking created
 *       409:
 *         description: Slot already booked
 */
router.post("/", limiter.booking, validate(createBookingSchema), bookingController.createBooking);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: List my bookings
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user bookings
 */
router.get("/", bookingController.getMyBookings);   // ?userId=<id>

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel an existing booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *               cancellationReason: { type: string }
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       403:
 *         description: Cancellation window expired
 */
router.patch("/:id/cancel", validate(cancelBookingSchema), bookingController.cancelBooking);

module.exports = router;
