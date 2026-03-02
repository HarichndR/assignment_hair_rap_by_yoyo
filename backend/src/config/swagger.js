const swaggerJsdoc = require("swagger-jsdoc");
const env = require("./env");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "HairRapByYoyo — Advanced Booking API",
            version: "1.0.0",
            description: "Interactive documentation for the HairRapByYoyo Salon Booking System. Supports multi-image uploads, intelligent management insights, and conflict-free booking.",
            contact: {
                name: "API Support",
                email: "support@hairrapbyyoyo.com",
            },
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}/api/v1`,
                description: "Development API Gateway (v1)",
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    required: ["name", "email", "phone", "firebaseUid"],
                    properties: {
                        _id: { type: "string", example: "60d0fe4f5311236168a109ca" },
                        name: { type: "string", example: "John Doe" },
                        email: { type: "string", format: "email", example: "john.doe@example.com" },
                        phone: { type: "string", example: "+919876543210" },
                        location: { type: "string", example: "Mumbai, India" },
                        firebaseUid: { type: "string", example: "abc123xyz789" },
                        image: {
                            type: "object",
                            properties: {
                                url: { type: "string", example: "https://res.cloudinary.com/..." },
                                public_id: { type: "string", example: "users/avatar_123" }
                            }
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                },
                Service: {
                    type: "object",
                    required: ["name", "duration", "price", "category"],
                    properties: {
                        _id: { type: "string", example: "60d0fe4f5311236168a109cb" },
                        name: { type: "string", example: "Men's Haircut" },
                        description: { type: "string", example: "Classic cut with styling and wash." },
                        duration: { type: "integer", description: "Duration in minutes", example: 45 },
                        price: { type: "number", example: 450 },
                        category: { type: "string", example: "Haircut" },
                        isActive: { type: "boolean", default: true },
                        images: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    url: { type: "string", example: "https://res.cloudinary.com/..." },
                                    public_id: { type: "string", example: "services/haircut_1" }
                                }
                            }
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                },
                Staff: {
                    type: "object",
                    required: ["name", "email", "phone"],
                    properties: {
                        _id: { type: "string", example: "60d0fe4f5311236168a109cc" },
                        name: { type: "string", example: "Priya Sharma" },
                        email: { type: "string", format: "email", example: "priya@hairrap.com" },
                        phone: { type: "string", example: "+919820012345" },
                        specialization: { type: "string", example: "Hair Styling & Coloring" },
                        services: {
                            type: "array",
                            items: { type: "string" },
                            description: "Array of Service ObjectIds this staff member can perform",
                            example: ["60d0fe4f5311236168a109cb"]
                        },
                        isAvailable: { type: "boolean", default: true },
                        images: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    url: { type: "string", example: "https://res.cloudinary.com/..." },
                                    public_id: { type: "string", example: "staff/priya_prof" }
                                }
                            }
                        },
                        workingHours: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    day: { type: "string", enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
                                    startTime: { type: "string", example: "10:00" },
                                    endTime: { type: "string", example: "19:00" }
                                }
                            },
                            example: [{ day: "monday", startTime: "10:00", endTime: "19:00" }]
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                },
                Booking: {
                    type: "object",
                    required: ["userId", "serviceId", "staffId", "date", "startTime"],
                    properties: {
                        _id: { type: "string", example: "60d0fe4f5311236168a109cd" },
                        userId: { type: "string", description: "ObjectId referencing User", example: "60d0fe4f5311236168a109ca" },
                        serviceId: { type: "string", description: "ObjectId referencing Service", example: "60d0fe4f5311236168a109cb" },
                        staffId: { type: "string", description: "ObjectId referencing Staff", example: "60d0fe4f5311236168a109cc" },
                        date: { type: "string", format: "date", example: "2026-03-05" },
                        startTime: { type: "string", example: "14:30" },
                        endTime: { type: "string", example: "15:15" },
                        status: { type: "string", enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
                        notes: { type: "string", example: "Allergic to certain shampoos." },
                        cancelledBy: { type: "string", enum: ["user", "admin", "system"], nullable: true },
                        cancellationReason: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" }
                    }
                },
                Settings: {
                    type: "object",
                    properties: {
                        cancellationWindowHours: { type: "number" },
                        bookingConfirmationRequired: { type: "boolean" },
                        salonStartTime: { type: "string" },
                        salonEndTime: { type: "string" }
                    }
                },
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
                CreateBookingInput: {
                    type: "object",
                    required: ["userId", "serviceId", "staffId", "date", "startTime"],
                    properties: {
                        userId: { type: "string", example: "60d0fe4f5311236168a109ca" },
                        serviceId: { type: "string", example: "60d0fe4f5311236168a109cb" },
                        staffId: { type: "string", example: "60d0fe4f5311236168a109cc" },
                        date: { type: "string", format: "date", example: "2026-03-05" },
                        startTime: { type: "string", example: "14:30" },
                        notes: { type: "string", example: "Please handle with care." }
                    }
                },
                CancelBookingInput: {
                    type: "object",
                    required: ["userId"],
                    properties: {
                        userId: { type: "string", example: "60d0fe4f5311236168a109ca" },
                        cancellationReason: { type: "string", example: "Personal emergency" }
                    }
                },
                UpdateSettingsInput: {
                    type: "object",
                    properties: {
                        cancellationWindowHours: { type: "number", example: 24 },
                        bookingConfirmationRequired: { type: "boolean", example: true },
                        salonStartTime: { type: "string", example: "10:00" },
                        salonEndTime: { type: "string", example: "19:00" }
                    }
                },
                UpdateBookingStatusInput: {
                    type: "object",
                    required: ["status"],
                    properties: {
                        status: { type: "string", enum: ["pending", "confirmed", "completed", "cancelled"] },
                        cancellationReason: { type: "string", example: "Staff unavailable" }
                    }
                }
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
