const express = require("express");
const serviceController = require("../controllers/service.controller");
const validate = require("../middlewares/validate");
const { getSlotsSchema } = require("../validations/booking.validation");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Public service information and availability
 */

/**
 * @swagger
 * /services/{id}/availability:
 *   get:
 *     summary: Get available slots for a service on a specific date
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *         description: Date to check (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of available slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get("/:id/availability", validate(getSlotsSchema, "query"), serviceController.getServiceAvailability);

module.exports = router;
