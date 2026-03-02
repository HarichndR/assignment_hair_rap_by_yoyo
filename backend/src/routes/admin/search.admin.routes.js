const express = require("express");
const searchController = require("../../controllers/admin/search.admin.controller");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Admin/Search
 *   description: Global search across all entities
 */

/**
 * @swagger
 * /admin/search:
 *   get:
 *     summary: Global search (Staff, Services, Users)
 *     description: Performs a keyword search across several database collections simultaneously.
 *     tags: [Admin/Search]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Search results returned
 */
router.get("/", searchController.globalSearch);

module.exports = router;
