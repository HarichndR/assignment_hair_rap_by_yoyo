const express = require("express");
const searchController = require("../../controllers/admin/search.admin.controller");

const router = express.Router();

/**
 * @swagger
 * /admin/search:
 *   get:
 *     summary: 'Admin: Unified Global Search'
 *     tags: [Admin Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Search query (min 2 chars)
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/", searchController.globalSearch);

module.exports = router;
