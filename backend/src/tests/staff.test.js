/**
 * Staff API Tests
 * Coverage:
 *   GET  /api/v1/admin/staff              - list with search & pagination
 *   POST /api/v1/admin/staff              - create
 *   PUT  /api/v1/admin/staff/:id          - update
 *   DELETE /api/v1/admin/staff/:id        - deactivate
 *   GET  /api/v1/services/:id/availability - availability slots
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const request = require("supertest");
const {
    connectTestDB, disconnectTestDB, clearCollections,
    seedService, seedStaff, seedSlot, models,
} = require("./setup/testHelpers");

let app;
beforeAll(async () => { await connectTestDB(); app = require("../../app"); });
afterAll(disconnectTestDB);
beforeEach(() => clearCollections(models.Staff, models.Service, models.AvailabilitySlot));

// ─── GET /api/v1/admin/staff ─────────────────────────────────────────────────
describe("GET /api/v1/admin/staff", () => {
    it("returns empty when no staff", async () => {
        const r = await request(app).get("/api/v1/admin/staff");
        expect(r.status).toBe(200);
        expect(r.body.data).toEqual([]);
    });

    it("returns only available staff", async () => {
        await seedStaff([], { isAvailable: true });
        await seedStaff([], { name: "Inactive", email: "i@i.com", isAvailable: false });
        const r = await request(app).get("/api/v1/admin/staff");
        expect(r.body.data.every((s) => s.isAvailable)).toBe(true);
        expect(r.body.data.length).toBe(1);
    });

    it("searches by name (case-insensitive)", async () => {
        await seedStaff([], { name: "Ravi Kumar" });
        await seedStaff([], { name: "Priya Sharma", email: "p@p.com" });
        const r = await request(app).get("/api/v1/admin/staff?search=ravi");
        expect(r.body.data[0].name).toBe("Ravi Kumar");
        expect(r.body.data.length).toBe(1);
    });

    it("paginates correctly", async () => {
        for (let i = 0; i < 5; i++) {
            await seedStaff([], { name: `Staff ${i}`, email: `s${i}@s.com` });
        }
        const r = await request(app).get("/api/v1/admin/staff?page=1&limit=2");
        expect(r.body.data.length).toBe(2);
        expect(r.body.meta.totalPages).toBeGreaterThan(1);
    });

    it("populates services array", async () => {
        const svc = await seedService();
        await seedStaff([svc._id]);
        const r = await request(app).get("/api/v1/admin/staff");
        expect(r.body.data[0].services[0].name).toBe("Men's Haircut");
    });
});

// ─── POST /api/v1/admin/staff ─────────────────────────────────────────────────
describe("POST /api/v1/admin/staff", () => {
    const valid = { name: "Sunita Patil", email: "sunita@salon.in", phone: "9876543211", specialization: "Bridal" };

    it("creates a stylist successfully", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send(valid);
        expect(r.status).toBe(201);
        expect(r.body.data.name).toBe("Sunita Patil");
    });

    it("rejects invalid email", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send({ ...valid, email: "not-an-email" });
        expect(r.status).toBe(400);
    });

    it("rejects invalid Indian phone (too short)", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send({ ...valid, email: "x@x.com", phone: "12345" });
        expect(r.status).toBe(400);
    });

    it("rejects phone not starting with 6-9", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send({ ...valid, email: "y@y.com", phone: "1234567890" });
        expect(r.status).toBe(400);
    });

    it("rejects name shorter than 2 chars", async () => {
        const r = await request(app).post("/api/v1/admin/staff").send({ ...valid, email: "z@z.com", name: "A" });
        expect(r.status).toBe(400);
    });

    it("accepts staff with services array", async () => {
        const svc = await seedService();
        const r = await request(app).post("/api/v1/admin/staff")
            .send({ ...valid, email: "new@salon.in", services: [svc._id.toString()] });
        expect(r.status).toBe(201);
        expect(r.body.data.services[0].name).toBe("Men's Haircut");
    });

    it("rejects duplicate email", async () => {
        await seedStaff([], { email: valid.email });
        const r = await request(app).post("/api/v1/admin/staff").send(valid);
        expect(r.status).toBe(409); // errorHandler returns 409 for duplicate key
    });
});

// ─── PUT /api/v1/admin/staff/:id ─────────────────────────────────────────────
describe("PUT /api/v1/admin/staff/:id", () => {
    it("updates specialization", async () => {
        const staff = await seedStaff();
        const r = await request(app).put(`/api/v1/admin/staff/${staff._id}`)
            .send({ specialization: "Colour Expert" });
        expect(r.status).toBe(200);
        expect(r.body.data.specialization).toBe("Colour Expert");
    });

    it("returns 404 for unknown id", async () => {
        const r = await request(app).put("/api/v1/admin/staff/000000000000000000000001").send({ name: "XX" });
        expect(r.status).toBe(404);
    });
});

// ─── DELETE /api/v1/admin/staff/:id ──────────────────────────────────────────
describe("DELETE /api/v1/admin/staff/:id", () => {
    it("sets isAvailable = false", async () => {
        const staff = await seedStaff();
        const r = await request(app).delete(`/api/v1/admin/staff/${staff._id}`);
        expect(r.status).toBe(200);
        const updated = await models.Staff.findById(staff._id);
        expect(updated.isAvailable).toBe(false);
    });

    it("returns 404 for unknown id", async () => {
        const r = await request(app).delete("/api/v1/admin/staff/000000000000000000000001");
        expect(r.status).toBe(404);
    });
});

// ─── GET /api/v1/services/:id/availability ───────────────────────────────────
describe("GET /api/v1/services/:id/availability", () => {
    it("returns available slots for eligible staff", async () => {
        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        await seedSlot(staff._id);
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const r = await request(app).get(`/api/v1/services/${svc._id}/availability?date=${tomorrow}`);
        expect(r.status).toBe(200);
        expect(r.body.data.length).toBe(1);
        expect(r.body.data[0].type).toBe("available");
    });

    it("returns empty if no staff offers this service", async () => {
        const svc = await seedService();
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const r = await request(app).get(`/api/v1/services/${svc._id}/availability?date=${tomorrow}`);
        expect(r.status).toBe(200);
        expect(r.body.data).toEqual([]);
    });

    it("returns 400 if date is missing", async () => {
        const svc = await seedService();
        const r = await request(app).get(`/api/v1/services/${svc._id}/availability`);
        expect(r.status).toBe(400);
    });

    it("returns 400 if date is invalid format", async () => {
        const svc = await seedService();
        const r = await request(app).get(`/api/v1/services/${svc._id}/availability?date=not-a-date`);
        expect(r.status).toBe(400);
    });

    it("does not return booked slots", async () => {
        const svc = await seedService();
        const staff = await seedStaff([svc._id]);
        await seedSlot(staff._id, { type: "booked" });
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const r = await request(app).get(`/api/v1/services/${svc._id}/availability?date=${tomorrow}`);
        expect(r.body.data.length).toBe(0);
    });
});
