const express = require("express");
const router = express.Router();
const uploadController = require("../../controllers/admin/upload.admin.controller");
const upload = require("../../middlewares/upload");



/**
 * @swagger
 * tags:
 *   name: Admin/Upload
 *   description: Media upload management for salon entities
 */

/**
 * @swagger
 * /admin/upload/services/{id}:
 *   post:
 *     summary: Upload images for a service
 *     tags: [Admin/Upload]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post(
    "/services/:id",
    upload.array("images", 3),
    uploadController.uploadServiceImages
);


/**
 * @swagger
 * /admin/upload/staff/{id}:
 *   post:
 *     summary: Upload profile images for a staff member
 *     tags: [Admin/Upload]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post(
    "/staff/:id",
    upload.array("images", 3),
    uploadController.uploadStaffImages
);


/**
 * @swagger
 * /admin/upload/users/{id}:
 *   post:
 *     summary: Upload user profile picture
 *     tags: [Admin/Upload]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post(
    "/users/:id",
    upload.array("image", 1),
    uploadController.uploadUserImages
);

module.exports = router;
