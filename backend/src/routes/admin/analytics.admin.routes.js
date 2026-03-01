const express = require("express");
const analyticsController = require("../../controllers/admin/analytics.admin.controller");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin/Analytics
 *   description: Salon performance analytics and insights
 */

/**
 * @swagger
 * /admin/analytics/dashboard:
 *   get:
 *     summary: Fetch Salon performance overview
 *     description: Returns aggregated data for revenue, booking counts, customer growth, and popular services. Used by the main dashboard.
 *     tags: [Admin/Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive analytics payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue: { type: number, example: 45200 }
 *                     appointmentCount: { type: integer, example: 124 }
 *                     activeCustomers: { type: integer, example: 85 }
 *                     pendingActions: { type: integer, example: 12 }
 *                     revenueChart: { type: array, items: { type: object } }
 */
router.get("/dashboard", analyticsController.getDashboardAnalytics);

module.exports = router;
