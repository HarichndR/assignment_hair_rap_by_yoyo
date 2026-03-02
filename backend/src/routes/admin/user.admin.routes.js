const express = require("express");
const userAdminController = require("../../controllers/admin/user.admin.controller");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin/Users
 *   description: User management for administrators
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all registered customers
 *     tags: [Admin/Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer directory retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/User' } }
 */
router.get("/", userAdminController.getAllUsers);

module.exports = router;
