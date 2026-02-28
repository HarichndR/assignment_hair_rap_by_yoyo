const express = require("express");
const aiController = require("../../controllers/admin/ai.admin.controller");
const limiter = require("../../middlewares/rateLimiter");

const router = express.Router();

/**
 * @swagger
 * /admin/ai/chat:
 *   post:
 *     summary: 'Admin: Chat with the Salon AI Assistant'
 *     tags: [Admin AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query: { type: string, example: "how many bookings today?" }
 *     responses:
 *       200:
 *         description: AI response based on real-time salon data
 */
router.post("/chat", limiter.aiChat, aiController.chat);

module.exports = router;
