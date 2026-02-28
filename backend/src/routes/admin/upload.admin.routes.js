const express = require("express");
const router = express.Router();
const uploadController = require("../../controllers/admin/upload.admin.controller");
const upload = require("../../middlewares/upload");

// Support 2-3 images as requested
/**
 * @swagger
 * /admin/upload/services/{id}:
 *   post:
 *     summary: 'Admin: Upload multi-images (max 3) for a service'
 *     tags: [Admin Upload]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Images uploaded and linked to service
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
 *     summary: 'Admin: Upload multi-images (max 3) for a staff member'
 *     tags: [Admin Upload]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Images uploaded and linked to staff
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
 *     summary: 'Admin: Upload single profile image for a user'
 *     tags: [Admin Upload]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
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
 *         description: Profile image uploaded and linked to user
 */
router.post(
    "/users/:id",
    upload.array("image", 1),
    uploadController.uploadUserImages
);

module.exports = router;
