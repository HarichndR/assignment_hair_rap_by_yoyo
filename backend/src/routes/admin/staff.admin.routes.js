const express = require("express");
const staffController = require("../../controllers/admin/staff.admin.controller");
const validate = require("../../middlewares/validate");
const slotController = require("../../controllers/admin/booking.admin.controller");
const { createStaffSchema, updateStaffSchema } = require("../../validations/staff.validation");
const { createSlotSchema } = require("../../validations/booking.validation");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin/Staff
 *   description: Administrative operations for salon staff
 */

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: Retrieve comprehensive Stylist directory
 *     description: Fetches all stylists, including their availability status, specialized services, and images.
 *     tags: [Admin/Staff]
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
 *                 data: { type: array, items: { $ref: '#/components/schemas/Staff' } }
 */
router.get("/", staffController.getAllStaff);

/**
 * @swagger
 * /admin/staff:
 *   post:
 *     summary: Onboard a new Stylist
 *     description: Adds a new staff member to the salon database. Required for booking assignments.
 *     tags: [Admin/Staff]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name: { type: string, example: "Arjun Mehta" }
 *               email: { type: string, format: email, example: "arjun@hairrap.com" }
 *               phone: { type: string, example: "+919800012345" }
 *               specialization: { type: string, example: "Master Stylist" }
 *               services: { type: array, items: { type: string }, example: ["60d0fe4f5311236168a109cb"] }
 *     responses:
 *       201:
 *         description: Staff member onboarded successfully
 */
router.post("/", validate(createStaffSchema), staffController.createStaffMember);

/**
 * @swagger
 * /admin/staff/{id}:
 *   put:
 *     summary: Update Stylist credentials or status
 *     description: Modify staff profile information, images, or availability.
 *     tags: [Admin/Staff]
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
 *             $ref: '#/components/schemas/Staff'
 *     responses:
 *       200:
 *         description: Stylist profile updated
 */
router.put("/:id", validate(updateStaffSchema), staffController.updateStaffMember);

/**
 * @swagger
 * /admin/staff/{id}:
 *   delete:
 *     summary: Archive/Deactivate Stylist
 *     description: Marks a stylist as inactive. Existing bookings remain, but new ones will be blocked.
 *     tags: [Admin/Staff]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stylist successfully deactivated
 */
router.delete("/:id", staffController.deactivateStaffMember);

module.exports = router;
