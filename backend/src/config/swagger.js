const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "The Salon — Advanced Booking API",
            version: "1.0.0",
            description: "Interactive documentation for the Indian Hair Salon Booking System. Supports multi-image uploads, intelligent management insights, and conflict-free booking.",
            contact: {
                name: "API Support",
                email: "support@thesalon.in",
            },
        },
        servers: [
            {
                url: "http://localhost:5000/api/v1",
                description: "Local Development Server",
            },
        ],
        components: {
            schemas: {
                ApiResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                        data: { type: "object" },
                        meta: { type: "object" },
                    },
                },
                ApiError: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        statusCode: { type: "integer" },
                        message: { type: "string" },
                        stack: { type: "string" },
                    },
                },
            },
        },
    },
    apis: [
        "./src/routes/*.js",
        "./src/routes/admin/*.js",
        "./src/models/*.js",
    ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
