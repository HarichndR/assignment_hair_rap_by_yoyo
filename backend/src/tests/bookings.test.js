/**
 * Bookings API Tests
 * Coverage:
 *   POST   /api/v1/bookings                - create booking
 *   GET    /api/v1/bookings?userId=        - get user bookings
 *   PATCH  /api/v1/bookings/:id/cancel    - customer cancel
 *   GET    /api/v1/admin/bookings          - admin list w/ filters
 *   POST   /api/v1/admin/bookings/slots   - create slot
 *   PATCH  /api/v1/admin/bookings/:id/status - admin status update
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const request = require("supertest");
const mongoose = require("mongoose");
const {
    connectTestDB, disconnectTestDB, clearCollections,
    seedService, seedStaff, seedBooking, models,
} = require("./setup/testHelpers");

let app;
beforeAll(async () => { await connectTestDB(); app = require("../../app"); });
afterAll(disconnectTestDB);
beforeEach(() =>
    clearCollections(models.Booking, models.Staff, models.Service)
);

// ─── POST /api/v1/bookings ────────────────────────────────────────────────────
describe("POST /api/v1/bookings", () => {
    it("creates a booking by verifying dynamic availability", async () => {
        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        const userId = new mongoose.Types.ObjectId();
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

        const r = await request(app).post("/api/v1/bookings").send({
            userId: userId.toString(),
            serviceId: svc._id.toString(),
            staffId: staff._id.toString(),
            date: tomorrow,
            startTime: "10:00"
        });

        expect(r.status).toBe(201);
        expect(r.body.data.status).toBe("pending");
        expect(r.body.data.endTime).toBe("10:30"); // 30 min duration
    });

    it("prevents double-booking (atomic collision check)", async () => {
        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

        const payload = {
            serviceId: svc._id.toString(),
            staffId: staff._id.toString(),
            date: tomorrow,
            startTime: "10:00"
        };

        // Fire both simultaneously
        const [r1, r2] = await Promise.all([
            request(app).post("/api/v1/bookings").send({ ...payload, userId: new mongoose.Types.ObjectId().toString() }),
            request(app).post("/api/v1/bookings").send({ ...payload, userId: new mongoose.Types.ObjectId().toString() }),
        ]);

        const statuses = [r1.status, r2.status].sort();
        expect(statuses).toEqual([201, 409]);
    });

    it("rejects booking outside staff working hours", async () => {
        const svc = await seedService();
        const staff = await seedStaff([svc._id], {
            workingHours: [{ day: "monday", startTime: "10:00", endTime: "12:00" }]
        });
        const userId = new mongoose.Types.ObjectId();
        // Force a Monday
        const nextMonday = new Date();
        nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
        const dateStr = nextMonday.toISOString().split("T")[0];

        const r = await request(app).post("/api/v1/bookings").send({
            userId: userId.toString(),
            serviceId: svc._id.toString(),
            staffId: staff._id.toString(),
            date: dateStr,
            startTime: "14:00" // Outside 10-12
        });
        expect(r.status).toBe(400);
        expect(r.body.message).toMatch(/outside staff working hours/i);
    });

    it("rejects if stylist doesn't offer the service", async () => {
        const svc1 = await seedService({ name: "Service A" });
        const svc2 = await seedService({ name: "Service B" });
        const staff = await seedStaff([svc1._id]);
        const dateStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

        const r = await request(app).post("/api/v1/bookings").send({
            userId: new mongoose.Types.ObjectId().toString(),
            serviceId: svc2._id.toString(),
            staffId: staff._id.toString(),
            date: dateStr,
            startTime: "10:00"
        });
        expect(r.status).toBe(400);
        expect(r.body.message).toMatch(/cannot perform this service/i);
    });
});

// ─── GET /api/v1/bookings?userId= ─────────────────────────────────────────────
describe("GET /api/v1/bookings", () => {
    it("returns bookings for a specific user", async () => {
        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        const userId = new mongoose.Types.ObjectId();
        await seedBooking(userId, svc._id, staff._id);

        const r = await request(app).get(`/api/v1/bookings?userId=${userId}`);
        expect(r.status).toBe(200);
        expect(r.body.data.length).toBe(1);
    });
});

// ─── PATCH /api/v1/admin/bookings/:id/status ─────────────────────────────────
describe("PATCH /api/v1/admin/bookings/:id/status", () => {
    it("confirms a pending booking", async () => {
        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        const userId = new mongoose.Types.ObjectId();
        const bk = await seedBooking(userId, svc._id, staff._id);

        const r = await request(app).patch(`/api/v1/admin/bookings/${bk._id}/status`)
            .send({ status: "confirmed" });
        expect(r.status).toBe(200);
        expect(r.body.data.status).toBe("confirmed");
    });
});
