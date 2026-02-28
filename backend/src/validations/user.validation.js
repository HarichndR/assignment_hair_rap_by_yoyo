const { z } = require("zod");

const MONGO_ID = z.string().trim().length(24, { message: "Must be a valid 24-character ID" });

const createUserSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email address"),
    phone: z.string().trim().optional(),
    location: z.string().trim().optional(),
});

const updateUserSchema = z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    location: z.string().trim().optional(),
});

module.exports = {
    createUserSchema,
    updateUserSchema,
};
