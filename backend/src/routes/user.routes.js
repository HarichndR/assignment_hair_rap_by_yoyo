const express = require("express");
const userController = require("../controllers/user.controller");
const validate = require("../middlewares/validate");
const { createUserSchema, updateUserSchema } = require("../validations/user.validation");

const router = express.Router();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               location: { type: string }
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/", validate(createUserSchema), userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile fetched
 */
router.get("/:id", userController.getUserProfile);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user profile
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
 *         description: User updated
 */
router.patch("/:id", validate(updateUserSchema), userController.updateUserProfile);

module.exports = router;
