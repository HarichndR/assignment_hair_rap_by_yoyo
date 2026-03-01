const { z } = require("zod");

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("5000"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    GEMINI_API_KEY: z.string().optional(),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    FRONTEND_URL: z.string().default("http://localhost:3000"),
    CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(" Invalid environment variables:");
    parsed.error.issues.forEach((e) => console.error(` - ${e.path.join(".")}: ${e.message}`));
    process.exit(1);
}

module.exports = parsed.data;
