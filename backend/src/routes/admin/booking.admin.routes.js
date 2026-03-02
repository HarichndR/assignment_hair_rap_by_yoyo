const express = require("express");
const bookingController = require("../../controllers/admin/booking.admin.controller");
const validate = require("../../middlewares/validate");
const { updateBookingStatusSchema } = require("../../validations/booking.validation");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin/Bookings
 *   description: Administrative booking management
 */

/**
 * @swagger
 * /admin/bookings:
 *   get:
 *     summary: Retrieve all system bookings
 *     description: Fetches every booking in the system with full details. Supports advanced filtering (to be implemented).
 *     tags: [Admin/Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Booking' } }
 */
router.get("/", bookingController.getAllBookings);


/**
 * @swagger
 * /admin/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status or log cancellation
 *     description: Allows admins to confirm, complete, or cancel any booking in the system.
 *     tags: [Admin/Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingStatusInput'
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 */
router.patch("/:id/status", validate(updateBookingStatusSchema), bookingController.updateBookingStatus);

module.exports = router;
