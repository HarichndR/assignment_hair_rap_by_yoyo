const express = require("express");
const bookingController = require("../controllers/booking.controller");
const validate = require("../middlewares/validate");
const limiter = require("../middlewares/rateLimiter");
const { createBookingSchema, cancelBookingSchema } = require("../validations/booking.validation");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Customer booking operations
 */

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Request a new salon appointment
 *     description: Creates a booking if the staff is available and the salon is open. Includes automatic conflict detection.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId, staffId, date, startTime]
 *             properties:
 *               serviceId: { type: string, example: "60d0fe4f5311236168a109cb" }
 *               staffId: { type: string, example: "60d0fe4f5311236168a109cc" }
 *               date: { type: string, format: date, example: "2026-03-05" }
 *               startTime: { type: string, example: "14:30" }
 *               notes: { type: string, example: "Please handle with care." }
 *     responses:
 *       201:
 *         description: Booking request submitted successfully
 *       400:
 *         description: Validation error (e.g., date in past)
 *       401:
 *         description: Unauthorized - Valid JWT required
 *       409:
 *         description: Conflict - Staff member already booked or salon closed
 *       429:
 *         description: Too many booking attempts
 */
router.post("/", limiter.booking, validate(createBookingSchema), bookingController.createBooking);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Retrieve your booking history
 *     description: Returns a list of all bookings associated with the authenticated user.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Booking' } }
 */
router.get("/", bookingController.getMyBookings);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a scheduled appointment
 *     description: Allows a user to cancel their booking. Subject to cancellation window settings.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Personal emergency" }
 *     responses:
 *       200:
 *         description: Booking successfully cancelled
 *       400:
 *         description: Cancellation window expired or invalid ID
 */
router.patch("/:id/cancel", validate(cancelBookingSchema), bookingController.cancelBooking);

module.exports = router;
