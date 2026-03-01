const express = require("express");
const aiController = require("../../controllers/admin/ai.admin.controller");
const limiter = require("../../middlewares/rateLimiter");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin/AI
 *   description: AI-assisted management operations
 */

/**
 * @swagger
 * /admin/ai/chat:
 *   post:
 *     summary: Interact with AI Management Assistant
 *     description: Ask questions about salon performance, staff scheduling, or revenue insights. Powered by advanced LP models.
 *     tags: [Admin/AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query: 
 *                 type: string
 *                 example: "What was our highest revenue day last week?"
 *                 description: Natural language query about salon data.
 *     responses:
 *       200:
 *         description: Intelligent response with data insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string, example: "The highest revenue was generated on Saturday, Feb 28th." }
 */
router.post("/chat", limiter.aiChat, aiController.chat);

module.exports = router;
