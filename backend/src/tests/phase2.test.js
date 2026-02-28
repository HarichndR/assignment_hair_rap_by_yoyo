const request = require("supertest");
const mongoose = require("mongoose");
const {
    connectTestDB, disconnectTestDB, clearCollections,
    seedService, seedStaff, models,
} = require("./setup/testHelpers");

let app;
const AppSettings = require("../models/settings.model");
const User = require("../models/user.model");

describe("Phase 2: Global Controls & Search", () => {
    let testStaff, testService, testUser;

    beforeAll(async () => {
        await connectTestDB();
        app = require("../../app");

        // Setup test data
        testService = await seedService({
            name: "Test Search Service",
            category: "Verification"
        });

        testStaff = await seedStaff([testService._id], {
            name: "Search Expert",
            email: "search@test.com"
        });

        testUser = await User.create({
            name: "Search Customer",
            email: "customer@search.com",
            phone: "9998887776"
        });
    });

    afterAll(async () => {
        await User.deleteMany({ email: "customer@search.com" });
        await disconnectTestDB();
    });

    beforeEach(async () => {
        await clearCollections(models.Booking, AppSettings);
    });

    describe("Business Hours Enforcement", () => {
        it("rejects booking if salon closed via global start/end times", async () => {
            // Salon opens at 11:00 AM
            await AppSettings.findOneAndUpdate(
                { _id: "app_settings" },
                { salonStartTime: "11:00", salonEndTime: "19:00" },
                { upsert: true, new: true }
            );

            const res = await request(app)
                .post("/api/v1/bookings")
                .send({
                    userId: testUser._id.toString(),
                    serviceId: testService._id.toString(),
                    staffId: testStaff._id.toString(),
                    date: "2026-03-02", // A Monday
                    startTime: "09:30" // Before 11:00 AM
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("operational hours");
        });

        it("allows booking if within both salon and staff hours", async () => {
            await AppSettings.findOneAndUpdate(
                { _id: "app_settings" },
                { salonStartTime: "08:00", salonEndTime: "21:00" },
                { upsert: true, new: true }
            );

            const res = await request(app)
                .post("/api/v1/bookings")
                .send({
                    userId: testUser._id.toString(),
                    serviceId: testService._id.toString(),
                    staffId: testStaff._id.toString(),
                    date: "2026-03-02",
                    startTime: "10:00"
                });

            expect(res.status).toBe(201);
        });
    });

    describe("Global Admin Search", () => {
        it("returns matches across staff, services, and users", async () => {
            const res = await request(app)
                .get("/api/v1/admin/search")
                .query({ q: "Search" });

            expect(res.status).toBe(200);
            expect(res.body.data.staff.length).toBeGreaterThan(0);
            expect(res.body.data.services.length).toBeGreaterThan(0);
            expect(res.body.data.users.length).toBeGreaterThan(0);
        });
    });
});
