const express = require("express");
const userController = require("../controllers/user.controller");
const validate = require("../middlewares/validate");
const { createUserSchema, updateUserSchema } = require("../validations/user.validation");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user profile linked to a Firebase UID. Validates phone and email uniqueness.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, firebaseUid]
 *             properties:
 *               name: { type: string, example: "John Doe" }
 *               email: { type: string, format: email, example: "john@example.com" }
 *               phone: { type: string, example: "+919876543210" }
 *               firebaseUid: { type: string, example: "UID12345" }
 *               location: { type: string, example: "Mumbai" }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/", validate(createUserSchema), userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieves the detailed profile of a user by their MongoDB ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60d0fe4f5311236168a109ca
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/User' }
 *       404:
 *         description: User not found
 */
router.get("/:id", userController.getUserProfile);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile
 *     description: Partially update user details like name, phone, or location.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               location: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid data provided
 */
router.patch("/:id", validate(updateUserSchema), userController.updateUserProfile);

module.exports = router;
