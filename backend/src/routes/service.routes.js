const express = require("express");
const serviceController = require("../controllers/service.controller");
const validate = require("../middlewares/validate");
const { getSlotsSchema } = require("../validations/booking.validation");

const router = express.Router();

/**
 * @swagger
 * /services:
 *   get:
 *     summary: List all active salon services
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter services by category (Cuts, Colour, etc.)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search services by name
 *     responses:
 *       200:
 *         description: List of services fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get("/", serviceController.listServices);

/**
 * @swagger
 * /services/{id}/availability:
 *   get:
 *     summary: Get live availability for a specific service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Available slots fetched successfully
 *       400:
 *         description: Invalid parameters
 */
router.get("/:id/availability", validate(getSlotsSchema, "query"), serviceController.getServiceAvailability);

module.exports = router;
