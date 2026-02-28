const express = require("express");
const settingsController = require("../../controllers/admin/settings.admin.controller");
const validate = require("../../middlewares/validate");
const { updateSettingsSchema } = require("../../validations/settings.validation");

const router = express.Router();

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: 'Admin: Fetch salon settings (cancellation rules, etc.)'
 *     tags: [Admin Settings]
 *     responses:
 *       200:
 *         description: Settings fetched
 */
router.get("/", settingsController.getSettings);

/**
 * @swagger
 * /admin/settings:
 *   patch:
 *     summary: 'Admin: Update salon settings'
 *     tags: [Admin Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationWindowHours: { type: integer, example: 24 }
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.patch("/", validate(updateSettingsSchema), settingsController.updateSettings);

module.exports = router;
