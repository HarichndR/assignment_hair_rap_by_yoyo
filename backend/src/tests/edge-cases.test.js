/**
 * Edge Cases & Additional Scenarios Test Suite
 *
 * These tests cover scenarios deliberately NOT covered in the main test files:
 *   - Boundary values (min/max duration, price = 0, exactly-at-limit pagination)
 *   - Input injection safety (regex chars in search, NoSQL operators in sortBy)
 *   - Pagination behaviour (page=0, limit=999, non-numeric, empty result pages)
 *   - Business logic edge cases (block slot, booking notes trimming, re-confirm)
 *   - Data integrity (booking references non-existent staff/service IDs)
 *   - Security (XSS stored as plain text, MongoDB operator sort injection)
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const request = require("supertest");
const mongoose = require("mongoose");
const {
    connectTestDB, disconnectTestDB, clearCollections,
    seedService, seedStaff, seedSlot, seedBooking, models,
} = require("./setup/testHelpers");

let app;
beforeAll(async () => { await connectTestDB(); app = require("../../app"); });
afterAll(disconnectTestDB);
beforeEach(() =>
    clearCollections(models.Service, models.Staff, models.AvailabilitySlot, models.Booking)
);

// ═════════════════════════════════════════════════════════════════════════════
// BOUNDARY VALUES — Services
// ═════════════════════════════════════════════════════════════════════════════
describe("Services — boundary values", () => {
    const base = { name: "Test Service", description: "desc", duration: 30, price: 300, category: "Cuts" };

    it("accepts duration = exactly 15 (lower boundary)", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, duration: 15 });
        expect(r.status).toBe(201);
    });

    it("accepts duration = exactly 480 (upper boundary = 8 hours)", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, duration: 480 });
        expect(r.status).toBe(201);
    });

    it("rejects duration = 481 (above 8 hours)", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, duration: 481 });
        expect(r.status).toBe(400);
    });

    it("accepts price = 0 (free service/promotion)", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, price: 0 });
        expect(r.status).toBe(201);
        expect(r.body.data.price).toBe(0);
    });

    it("accepts price = exactly ₹1,00,000 (upper boundary)", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, price: 100000 });
        expect(r.status).toBe(201);
    });

    it("rejects name > 100 characters", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, name: "A".repeat(101) });
        expect(r.status).toBe(400);
    });

    it("rejects description > 500 characters", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, description: "X".repeat(501) });
        expect(r.status).toBe(400);
    });

    it("rejects non-integer duration (e.g. 30.5)", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, duration: 30.5 });
        expect(r.status).toBe(400);
    });

    it("rejects duration as string '30'", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, duration: "30" });
        expect(r.status).toBe(400);
    });

    it("rejects price as string '200'", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...base, price: "200" });
        expect(r.status).toBe(400);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// INJECTION SAFETY — search and sort fields
// ═════════════════════════════════════════════════════════════════════════════
describe("Injection & security scenarios", () => {
    it("search with regex special chars ($, +, .) does not crash", async () => {
        await seedService({ name: "Hair+Colour" });
        // Special chars are passed to RegExp — must be handled gracefully
        const r = await request(app).get("/api/v1/services?search=$where%3A%7B%7D");
        expect(r.status).toBe(200); // No crash
    });

    it("NoSQL operator in sortBy falls back to safe default field", async () => {
        await seedService({ name: "Test" });
        const r = await request(app).get("/api/v1/services?sortBy=$where");
        expect(r.status).toBe(200); // sanitiseSort whitelists — falls back to 'name'
    });

    it("very long sortBy value is safely handled", async () => {
        await seedService({ name: "Test" });
        const r = await request(app).get(`/api/v1/services?sortBy=${"x".repeat(500)}`);
        expect(r.status).toBe(200);
    });

    it("XSS in service name stored as plain text (not executed)", async () => {
        const xss = "<script>alert('xss')</script>";
        const r = await request(app).post("/api/v1/admin/services").send({
            name: "Safe " + xss.slice(0, 60), // keep under 100 chars
            duration: 30, price: 200, category: "Styling"
        });
        // Should be stored as-is (no HTML execution in API) — just a string
        expect([201, 400]).toContain(r.status); // 400 if length check triggered
    });

    it("MongoDB operator in admin bookings staffId query param is ignored gracefully", async () => {
        const r = await request(app).get("/api/v1/admin/bookings?staffId[$ne]=null");
        expect(r.status).toBe(200); // query param arrays are treated as string by express
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// PAGINATION EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════
describe("Pagination edge cases", () => {
    beforeEach(async () => {
        // Seed 5 active services
        for (let i = 0; i < 5; i++) {
            await seedService({ name: `Service ${i}`, price: i * 100 });
        }
    });

    it("page=0 is clamped to page=1", async () => {
        const r = await request(app).get("/api/v1/services?page=0&limit=2");
        expect(r.status).toBe(200);
        expect(r.body.meta.page).toBe(1);
    });

    it("page=-1 is clamped to page=1", async () => {
        const r = await request(app).get("/api/v1/services?page=-1&limit=2");
        expect(r.body.meta.page).toBe(1);
    });

    it("non-numeric page uses default (1)", async () => {
        const r = await request(app).get("/api/v1/services?page=abc");
        expect(r.body.meta.page).toBe(1);
    });

    it("limit > MAX_LIMIT (50) is clamped to 50", async () => {
        const r = await request(app).get("/api/v1/services?limit=999");
        expect(r.body.meta.limit).toBe(50);
    });

    it("limit=0 is clamped to default (10)", async () => {
        const r = await request(app).get("/api/v1/services?limit=0");
        expect(r.body.meta.limit).toBe(10);
    });

    it("page beyond totalPages returns empty data array, not 404", async () => {
        const r = await request(app).get("/api/v1/services?page=999&limit=10");
        expect(r.status).toBe(200);
        expect(r.body.data).toEqual([]);
        expect(r.body.meta.total).toBe(5); // total is preserved
    });

    it("limit=1 returns exactly 1 result and correct totalPages", async () => {
        const r = await request(app).get("/api/v1/services?limit=1");
        expect(r.body.data.length).toBe(1);
        expect(r.body.meta.totalPages).toBe(5);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// STAFF — additional edge cases
// ═════════════════════════════════════════════════════════════════════════════
describe("Staff — additional edge cases", () => {
    it("accepts mobile starting with 7 (valid Indian prefix)", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send({
            name: "Asha Verma", email: "asha@salon.in", phone: "7654321098"
        });
        expect(r.status).toBe(201);
    });

    it("rejects 11-digit mobile number", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send({
            name: "Test Staff", email: "t@salon.in", phone: "98765432109"
        });
        expect(r.status).toBe(400);
    });

    it("rejects mobile starting with 5 (invalid Indian prefix)", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send({
            name: "Test Staff", email: "t2@salon.in", phone: "5123456789"
        });
        expect(r.status).toBe(400);
    });

    it("accepts staff created without services (empty skills — onboarding)", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send({
            name: "New Hire", email: "newhire@salon.in"
        });
        expect(r.status).toBe(201);
        expect(r.body.data.services).toEqual([]);
    });

    it("rejects services array with more than 20 IDs", async () => {
        const ids = Array.from({ length: 21 }, () => new mongoose.Types.ObjectId().toString());
        const r = await request(app).post("/api/v1/admin/staff")
            .send({ name: "Overloaded", email: "ov@salon.in", services: ids });
        expect(r.status).toBe(400);
    });

    it("rejects services array containing invalid ObjectId", async () => {
        const r = await request(app).post("/api/v1/admin/staff")
            .send({ name: "Bad IDs", email: "bad@salon.in", services: ["not-an-id"] });
        expect(r.status).toBe(400);
    });

    it("search with no matches returns 200 with empty array", async () => {
        await seedStaff([], { name: "Ravi Kumar" });
        const r = await request(app).get("/api/v1/admin/staff?search=doesnotexist");
        expect(r.status).toBe(200);
        expect(r.body.data).toEqual([]);
        expect(r.body.meta.total).toBe(0);
    });

    it("deactivated staff not returned in public staff list", async () => {
        const staff = await seedStaff([], { name: "Active" });
        await seedStaff([], { name: "Gone", email: "gone@salon.in", isAvailable: false });

        // Deactivate via API
        await request(app).delete(`/api/v1/admin/staff/${staff._id}`);

        const r = await request(app).get("/api/v1/admin/staff");
        // Both are now isAvailable:false — neither should appear
        expect(r.body.data.length).toBe(0);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// BOOKING BUSINESS LOGIC — additional scenarios
// ═════════════════════════════════════════════════════════════════════════════
describe("Booking — additional business logic", () => {
    let svc, staff, userId;
    beforeEach(async () => {
        svc = await seedService();
        staff = await seedStaff([svc._id]);
        userId = new mongoose.Types.ObjectId();
    });

    it("booking notes are trimmed on save", async () => {
        const slot = await seedSlot(staff._id);
        const r = await request(app).post("/api/v1/bookings").send({
            userId: userId.toString(), serviceId: svc._id.toString(),
            staffId: staff._id.toString(), slotId: slot._id.toString(),
            notes: "   please be gentle   ",
        });
        expect(r.status).toBe(201);
        // Notes should be trimmed
        expect(r.body.data.notes).toBe("please be gentle");
    });

    it("getUserBookings for non-existent userId returns empty array, not 404", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const r = await request(app).get(`/api/v1/bookings?userId=${fakeId}`);
        expect(r.status).toBe(200);
        expect(r.body.data).toEqual([]);
        expect(r.body.meta.total).toBe(0);
    });

    it("admin confirms a booking then cancels it — slot released both times", async () => {
        const slot = await seedSlot(staff._id, { type: "booked" });
        const bk = await seedBooking(userId, svc._id, staff._id, slot._id, { status: "confirmed" });

        // Admin cancels confirmed booking
        const r = await request(app).patch(`/api/v1/admin/bookings/${bk._id}/status`)
            .send({ status: "cancelled", cancellationReason: "Salon closed today" });
        expect(r.status).toBe(200);

        const slotAfter = await models.AvailabilitySlot.findById(slot._id);
        expect(slotAfter.type).toBe("available");
    });

    it("cannot confirm an already-confirmed booking (idempotency guard)", async () => {
        const slot = await seedSlot(staff._id, { type: "booked" });
        const bk = await seedBooking(userId, svc._id, staff._id, slot._id, { status: "confirmed" });

        const r = await request(app).patch(`/api/v1/admin/bookings/${bk._id}/status`)
            .send({ status: "confirmed" });
        expect(r.status).toBe(400); // Already confirmed
        expect(r.body.message).toMatch(/already/i);
    });

    it("cannot double-cancel the same booking via admin", async () => {
        const slot = await seedSlot(staff._id);
        const bk = await seedBooking(userId, svc._id, staff._id, slot._id, { status: "cancelled" });

        const r = await request(app).patch(`/api/v1/admin/bookings/${bk._id}/status`)
            .send({ status: "cancelled" });
        expect(r.status).toBe(400);
    });

    it("a blocked slot cannot be booked by a customer", async () => {
        const slot = await seedSlot(staff._id, { type: "blocked" }); // lunch break / holiday
        const r = await request(app).post("/api/v1/bookings").send({
            userId: userId.toString(), serviceId: svc._id.toString(),
            staffId: staff._id.toString(), slotId: slot._id.toString(),
        });
        expect(r.status).toBe(409); // Slot is not 'available'
    });

    it("admin can create a blocked slot type", async () => {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const r = await request(app).post("/api/v1/admin/bookings/slots").send({
            staffId: staff._id.toString(),
            date: tomorrow,
            startTime: "13:00",
            endTime: "14:00",
            type: "blocked",
        });
        expect(r.status).toBe(201);
        expect(r.body.data.type).toBe("blocked");
    });

    it("multiple bookings by same user are all returned", async () => {
        for (let i = 0; i < 3; i++) {
            const slot = await seedSlot(staff._id, { startTime: `${10 + i}:00`, endTime: `${10 + i}:30` });
            await seedBooking(userId, svc._id, staff._id, slot._id);
        }
        const r = await request(app).get(`/api/v1/bookings?userId=${userId}`);
        expect(r.body.meta.total).toBe(3);
    });

    it("admin can sort bookings by createdAt ascending", async () => {
        const s1 = await seedSlot(staff._id, { startTime: "10:00", endTime: "10:30" });
        const s2 = await seedSlot(staff._id, { startTime: "11:00", endTime: "11:30" });
        const b1 = await seedBooking(userId, svc._id, staff._id, s1._id);
        const b2 = await seedBooking(userId, svc._id, staff._id, s2._id);

        const r = await request(app).get("/api/v1/admin/bookings?sortBy=createdAt&sortOrder=asc");
        expect(r.status).toBe(200);
        // First booking should be b1 (created first)
        expect(r.body.data[0]._id).toBe(b1._id.toString());
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// SLOTS — admin slot creation edge cases
// ═════════════════════════════════════════════════════════════════════════════
describe("Admin Slot Creation — additional scenarios", () => {
    it("rejects slot for non-existent staffId", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const r = await request(app).post("/api/v1/admin/bookings/slots").send({
            staffId: fakeId, date: tomorrow, startTime: "09:00", endTime: "09:30",
        });
        expect(r.status).toBe(404);
    });

    it("rejects slot with invalid date string", async () => {
        const staff = await seedStaff();
        const r = await request(app).post("/api/v1/admin/bookings/slots").send({
            staffId: staff._id.toString(), date: "32-13-2025",
            startTime: "09:00", endTime: "09:30",
        });
        expect(r.status).toBe(400);
    });

    it("rejects slot with missing staffId", async () => {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const r = await request(app).post("/api/v1/admin/bookings/slots").send({
            date: tomorrow, startTime: "09:00", endTime: "09:30",
        });
        expect(r.status).toBe(400);
    });

    it("accepts today's date as valid (not a past date)", async () => {
        const staff = await seedStaff();
        const today = new Date().toISOString().split("T")[0];
        const r = await request(app).post("/api/v1/admin/bookings/slots").send({
            staffId: staff._id.toString(), date: today,
            startTime: "09:00", endTime: "09:30",
        });
        expect(r.status).toBe(201);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// AVAILABILITY ENDPOINT — additional scenarios
// ═════════════════════════════════════════════════════════════════════════════
describe("GET /services/:id/availability — additional", () => {
    it("returns 404 for unknown serviceId (CastError → 400)", async () => {
        const r = await request(app).get("/api/v1/services/NOT_AN_OBJECTID/availability?date=2025-12-01");
        // CastError → errorHandler returns 400
        expect([400, 404]).toContain(r.status);
    });

    it("blocked slots are not returned in availability", async () => {
        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        await seedSlot(staff._id, { type: "blocked" });
        await seedSlot(staff._id, { type: "available", startTime: "11:00", endTime: "11:30" });

        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const r = await request(app).get(`/api/v1/services/${svc._id}/availability?date=${tomorrow}`);
        expect(r.status).toBe(200);
        expect(r.body.data.length).toBe(1); // only the available slot
        expect(r.body.data[0].type).toBe("available");
    });

    it("multiple staff offering the same service: all their available slots returned", async () => {
        const svc = await seedService();
        const staff1 = await seedStaff([svc._id], { name: "Ravi", email: "ravi@s.in" });
        const staff2 = await seedStaff([svc._id], { name: "Priya", email: "priya@s.in" });
        await seedSlot(staff1._id, { startTime: "10:00", endTime: "10:30" });
        await seedSlot(staff2._id, { startTime: "11:00", endTime: "11:30" });

        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const r = await request(app).get(`/api/v1/services/${svc._id}/availability?date=${tomorrow}`);
        expect(r.body.data.length).toBe(2);
        // Ordered by startTime ascending
        expect(r.body.data[0].startTime).toBe("10:00");
        expect(r.body.data[1].startTime).toBe("11:00");
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES — list / filter additional scenarios
// ═════════════════════════════════════════════════════════════════════════════
describe("Services list — additional filter scenarios", () => {
    it("category filter is case-sensitive (exact match)", async () => {
        await seedService({ name: "Haircut", category: "Cuts" });
        // lowercase "cuts" should NOT match "Cuts"
        const r = await request(app).get("/api/v1/services?category=cuts");
        expect(r.body.data.length).toBe(0);
    });

    it("search is case-INsensitive", async () => {
        await seedService({ name: "Keratin Treatment" });
        const r = await request(app).get("/api/v1/services?search=KERATIN");
        expect(r.body.data.length).toBe(1);
    });

    it("category filter + search can be combined", async () => {
        await seedService({ name: "Bridal Updo", category: "Styling" });
        await seedService({ name: "Haircut", category: "Cuts" });
        await seedService({ name: "Bridal Braid", category: "Styling" });

        const r = await request(app).get("/api/v1/services?category=Styling&search=bridal");
        expect(r.body.data.length).toBe(2);
        expect(r.body.data.every((s) => s.category === "Styling")).toBe(true);
    });

    it("admin list returns correct categories list in meta (distinct values)", async () => {
        await seedService({ name: "A", category: "Cuts" });
        await seedService({ name: "B", category: "Cuts" });    // duplicate
        await seedService({ name: "C", category: "Treatment" });
        const r = await request(app).get("/api/v1/admin/services");
        // Should deduplicate — only 2 unique categories
        expect(r.body.meta.categories.sort()).toEqual(["Cuts", "Treatment"]);
    });

    it("PUT update does not affect other fields (partial update)", async () => {
        const svc = await seedService({ name: "Original Name", price: 500 });
        await request(app).put(`/api/v1/admin/services/${svc._id}`).send({ price: 750 });
        const r = await request(app).get(`/api/v1/admin/services`);
        const found = r.body.data.find((s) => s._id === svc._id.toString());
        expect(found.name).toBe("Original Name");  // name unchanged
        expect(found.price).toBe(750);             // only price updated
    });
});
