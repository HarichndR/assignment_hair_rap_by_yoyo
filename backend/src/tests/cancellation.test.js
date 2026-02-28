/**
 * Cancellation Window Enforcement Tests
 *
 * Logic:
 *   - Check if a customer can cancel based on AppSettings.cancellationWindowHours.
 *   - Verify slot is released correctly.
 */
const request = require("supertest");
const mongoose = require("mongoose");
const {
    connectTestDB, disconnectTestDB, clearCollections,
    seedService, seedStaff, seedSlot, seedBooking, models
} = require("./setup/testHelpers");
const AppSettings = require("../models/settings.model");

let app;
beforeAll(async () => {
    await connectTestDB();
    app = require("../../app");
});
afterAll(disconnectTestDB);
beforeEach(() =>
    clearCollections(models.Service, models.Staff, models.AvailabilitySlot, models.Booking)
);

describe("Cancellation Window Logic", () => {
    it("allows cancellation within the window (e.g. 0 hours)", async () => {
        const settings = await AppSettings.getSingleton();
        settings.cancellationWindowHours = 0;
        await settings.save();

        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        const slot = await seedSlot(staff._id);
        const userId = new mongoose.Types.ObjectId();
        const bk = await seedBooking(userId, svc._id, staff._id, slot._id);
        await models.AvailabilitySlot.findByIdAndUpdate(slot._id, { type: "booked" });

        const r = await request(app)
            .patch(`/api/v1/bookings/${bk._id}/cancel`)
            .send({ userId: userId.toString() });

        expect(r.status).toBe(200);
        expect(r.body.data.status).toBe("cancelled");

        const releasedSlot = await models.AvailabilitySlot.findById(slot._id);
        expect(releasedSlot.type).toBe("available");
    });

    it("blocks cancellation if too close to appointment (e.g. 24h window)", async () => {
        const settings = await AppSettings.getSingleton();
        settings.cancellationWindowHours = 24;
        await settings.save();

        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        const slot = await seedSlot(staff._id);
        const userId = new mongoose.Types.ObjectId();

        // Appointment is 1 hour from now, status: CONFIRMED
        // We simulate a confirmed booking for the window to apply
        const bk = await seedBooking(userId, svc._id, staff._id, slot._id, {
            status: "confirmed",
            date: new Date(Date.now() + 3600000), // 1h in future
            startTime: "12:00"
        });

        const r = await request(app)
            .patch(`/api/v1/bookings/${bk._id}/cancel`)
            .send({ userId: userId.toString() });

        expect(r.status).toBe(403);
        expect(r.body.message).toMatch(/at least 24 hour\(s\)/i);
    });

    it("allows cancellation regardless of time if status is PENDING", async () => {
        const settings = await AppSettings.getSingleton();
        settings.cancellationWindowHours = 24;
        await settings.save();

        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        const slot = await seedSlot(staff._id);
        const userId = new mongoose.Types.ObjectId();

        // Appointment is 1 hour from now but status: PENDING
        const bk = await seedBooking(userId, svc._id, staff._id, slot._id, {
            status: "pending",
            date: new Date(Date.now() + 3600000)
        });

        const r = await request(app)
            .patch(`/api/v1/bookings/${bk._id}/cancel`)
            .send({ userId: userId.toString() });

        expect(r.status).toBe(200);
        expect(r.body.data.status).toBe("cancelled");
    });
});
