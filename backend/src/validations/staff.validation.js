const { z } = require("zod");

const MONGO_ID = z.string().trim().length(24, { message: "Must be a valid 24-character ID" });

const createStaffSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name cannot exceed 80 characters"),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
    phone: z
        .string()
        .trim()
        .regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian mobile number (starts with 6-9)")
        .optional(),
    specialization: z
        .string()
        .trim()
        .min(2, "Specialization must be at least 2 characters")
        .max(100, "Specialization cannot exceed 100 characters")
        .optional(),
    services: z
        .array(MONGO_ID, { invalid_type_error: "services must be an array of IDs" })
        .max(20, "Cannot assign more than 20 services to one staff member")
        .optional(),
});

const updateStaffSchema = createStaffSchema.partial();

module.exports = { createStaffSchema, updateStaffSchema };
