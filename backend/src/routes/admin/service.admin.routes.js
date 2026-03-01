const express = require("express");
const serviceController = require("../../controllers/admin/service.admin.controller");
const validate = require("../../middlewares/validate");
const { createServiceSchema, updateServiceSchema } = require("../../validations/service.validation");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin/Services
 *   description: Administrative operations for salon services
 */

/**
 * @swagger
 * /admin/services:
 *   get:
 *     summary: List all Salon Services
 *     description: Retrieves the complete catalog of services offered by the salon.
 *     tags: [Admin/Services]
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
 *                 data: { type: array, items: { $ref: '#/components/schemas/Service' } }
 */
router.get("/", serviceController.listServices);

/**
 * @swagger
 * /admin/services:
 *   post:
 *     summary: Add a new Service to the catalog
 *     description: Define new salon offerings including pricing, duration, and imagery.
 *     tags: [Admin/Services]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       201:
 *         description: Service added successfully
 */
router.post("/", validate(createServiceSchema), serviceController.createService);

/**
 * @swagger
 * /admin/services/{id}:
 *   put:
 *     summary: Update existing Service
 *     description: Edit service parameters such as price adjustments or duration changes.
 *     tags: [Admin/Services]
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
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: Service updated successfully
 */
router.put("/:id", validate(updateServiceSchema), serviceController.updateService);

/**
 * @swagger
 * /admin/services/{id}:
 *   delete:
 *     summary: Remove Service from catalog
 *     description: 'Permanently deletes a service definition. Warning: This may affect historical booking references if not handled at the database level.'
 *     tags: [Admin/Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service successfully removed
 */
router.delete("/:id", serviceController.deleteService);

module.exports = router;
