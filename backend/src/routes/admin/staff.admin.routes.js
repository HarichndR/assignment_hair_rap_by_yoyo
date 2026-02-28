const express = require("express");
const staffController = require("../../controllers/admin/staff.admin.controller");
const validate = require("../../middlewares/validate");
const slotController = require("../../controllers/admin/booking.admin.controller");
const { createStaffSchema, updateStaffSchema } = require("../../validations/staff.validation");
const { createSlotSchema } = require("../../validations/booking.validation");

const router = express.Router();

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: 'Admin: List all staff members'
 *     tags: [Admin Staff]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Staff list fetched
 */
router.get("/", staffController.getAllStaff);

/**
 * @swagger
 * /admin/staff:
 *   post:
 *     summary: 'Admin: Onboard a new staff member'
 *     tags: [Admin Staff]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, specialization]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               specialization: { type: string }
 *               services: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Staff onboarded
 */
router.post("/", validate(createStaffSchema), staffController.createStaffMember);

/**
 * @swagger
 * /admin/staff/{id}:
 *   put:
 *     summary: 'Admin: Update staff details'
 *     tags: [Admin Staff]
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
 *               name: { type: string }
 *               specialization: { type: string }
 *               isAvailable: { type: boolean }
 *     responses:
 *       200:
 *         description: Staff updated
 */
router.put("/:id", validate(updateStaffSchema), staffController.updateStaffMember);

/**
 * @swagger
 * /admin/staff/{id}:
 *   delete:
 *     summary: 'Admin: Deactivate a staff member'
 *     tags: [Admin Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Staff deactivated
 */
router.delete("/:id", staffController.deactivateStaffMember);

module.exports = router;
