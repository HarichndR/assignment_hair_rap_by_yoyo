const { z } = require("zod");

const createServiceSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Service name must be at least 2 characters")
        .max(100, "Service name cannot exceed 100 characters"),
    description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .optional(),
    duration: z
        .number({ required_error: "Duration is required", invalid_type_error: "Duration must be a number" })
        .int("Duration must be a whole number of minutes")
        .min(15, "Minimum duration is 15 minutes")
        .max(480, "Maximum duration is 8 hours (480 minutes)"),
    price: z
        .number({ required_error: "Price is required", invalid_type_error: "Price must be a number" })
        .min(0, "Price cannot be negative")
        .max(100000, "Price seems too high — maximum ₹1,00,000"),
    category: z
        .string()
        .trim()
        .min(2, "Category must be at least 2 characters")
        .max(50, "Category cannot exceed 50 characters"),
});


const updateServiceSchema = createServiceSchema.partial();

module.exports = { createServiceSchema, updateServiceSchema };
