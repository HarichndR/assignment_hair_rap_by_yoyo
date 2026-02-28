/**
 * Global Error Handling & Response Format Tests
 *
 * Verifies that:
 *  - Responses follow { success: false, statusCode: 404, message: "..." }
 *  - Mongoose ValidationErrors → 400
 *  - Mongoose CastErrors → 400
 *  - Duplicate key errors → 409
 *  - Route not found → 404
 */
const request = require("supertest");
const mongoose = require("mongoose");
const { connectTestDB, disconnectTestDB, clearCollections, seedStaff, models } = require("./setup/testHelpers");

let app;
beforeAll(async () => {
    await connectTestDB();
    app = require("../../app");
});
afterAll(disconnectTestDB);
beforeEach(() => clearCollections(models.Staff));

describe("Global Error Handler", () => {
    it("returns 404 with standard format for unknown routes", async () => {
        const r = await request(app).get("/api/v1/non-existent-route");
        expect(r.status).toBe(404);
        expect(r.body).toEqual({
            success: false,
            statusCode: 404,
            message: "Route not found"
        });
    });

    it("returns 400 for Mongoose CastError (invalid ObjectId)", async () => {
        const r = await request(app).put("/api/v1/admin/services/invalid-id").send({ name: "Fix" });
        expect(r.status).toBe(400);
        expect(r.body.success).toBe(false);
        expect(r.body.message).toMatch(/invalid/i);
    });

    it("returns 409 for duplicate key errors", async () => {
        await seedStaff([], { email: "dup@test.com" });
        const r = await request(app).post("/api/v1/admin/staff").send({
            name: "Duplicate",
            email: "dup@test.com",
            phone: "9876543210"
        });
        expect(r.status).toBe(409);
        expect(r.body.message).toMatch(/exists/i);
    });

    it("returns 400 for Zod validation errors", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ name: "A" }); // too short
        expect(r.status).toBe(400);
        expect(r.body.success).toBe(false);
        // errorHandler.js puts them in meta.errors
        expect(Array.isArray(r.body.meta.errors)).toBe(true);
    });
});
