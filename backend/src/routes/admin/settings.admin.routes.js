const express = require("express");
const settingsController = require("../../controllers/admin/settings.admin.controller");
const validate = require("../../middlewares/validate");
const { updateSettingsSchema } = require("../../validations/settings.validation");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin/Settings
 *   description: Global salon configuration
 */

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Fetch global salon settings
 *     tags: [Admin/Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current settings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Settings' }
 */
router.get("/", settingsController.getSettings);


/**
 * @swagger
 * /admin/settings:
 *   patch:
 *     summary: Update global salon configuration
 *     description: Modify operational parameters like salon hours and cancellation policies.
 *     tags: [Admin/Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsInput'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.patch("/", validate(updateSettingsSchema), settingsController.updateSettings);

module.exports = router;
