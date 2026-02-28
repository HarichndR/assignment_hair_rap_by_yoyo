/**
 * Services API Tests
 * Coverage:
 *   GET  /api/v1/services                  - list with filters/sort/pagination
 *   GET  /api/v1/admin/services            - admin list (includes inactive)
 *   POST /api/v1/admin/services            - create
 *   PUT  /api/v1/admin/services/:id        - update
 *   DELETE /api/v1/admin/services/:id      - soft delete
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const request = require("supertest");
const {
    connectTestDB, disconnectTestDB, clearCollections,
    seedService, models,
} = require("./setup/testHelpers");

let app;

beforeAll(async () => {
    await connectTestDB();
    app = require("../../app");          // shared Express app (no DB connect)
});
afterAll(disconnectTestDB);
beforeEach(() => clearCollections(models.Service));

// ─── Public: GET /api/v1/services ────────────────────────────────────────────
describe("GET /api/v1/services", () => {
    it("returns empty array when no services", async () => {
        const r = await request(app).get("/api/v1/services");
        expect(r.status).toBe(200);
        expect(r.body.data).toEqual([]);
        expect(r.body.meta.total).toBe(0);
    });

    it("returns only active services", async () => {
        await seedService({ name: "Active Cut", isActive: true });
        await seedService({ name: "Inactive Cut", isActive: false, email: "i@i.com" });
        const r = await request(app).get("/api/v1/services");
        expect(r.status).toBe(200);
        expect(r.body.data.every((s) => s.isActive)).toBe(true);
        expect(r.body.data.length).toBe(1);
    });

    it("filters by category", async () => {
        await seedService({ name: "Haircut", category: "Cuts" });
        await seedService({ name: "Keratin", category: "Treatment" });
        const r = await request(app).get("/api/v1/services?category=Cuts");
        expect(r.status).toBe(200);
        expect(r.body.data.every((s) => s.category === "Cuts")).toBe(true);
    });

    it("filters by search (case-insensitive)", async () => {
        await seedService({ name: "Bridal Hairstyle" });
        await seedService({ name: "Beard Trim" });
        const r = await request(app).get("/api/v1/services?search=bridal");
        expect(r.status).toBe(200);
        expect(r.body.data[0].name).toBe("Bridal Hairstyle");
    });

    it("sorts by price ascending", async () => {
        await seedService({ name: "Cheap", price: 100 });
        await seedService({ name: "Expensive", price: 2000 });
        const r = await request(app).get("/api/v1/services?sortBy=price&sortOrder=asc");
        expect(r.body.data[0].price).toBe(100);
    });

    it("sorts by price descending", async () => {
        await seedService({ name: "Cheap", price: 100 });
        await seedService({ name: "Expensive", price: 2000 });
        const r = await request(app).get("/api/v1/services?sortBy=price&sortOrder=desc");
        expect(r.body.data[0].price).toBe(2000);
    });

    it("paginates correctly", async () => {
        await Promise.all([...Array(5)].map((_, i) =>
            seedService({ name: `Service ${i}`, price: i * 100 })
        ));
        const r = await request(app).get("/api/v1/services?page=2&limit=2");
        expect(r.status).toBe(200);
        expect(r.body.data.length).toBeLessThanOrEqual(2);
        expect(r.body.meta.page).toBe(2);
    });

    it("rejects dangerous sortBy (injection attempt)", async () => {
        await seedService({ name: "A" });
        // Should not throw — sanitiseSort falls back to safe field
        const r = await request(app).get("/api/v1/services?sortBy=$where");
        expect(r.status).toBe(200);
    });
});

// ─── Admin: GET /api/v1/admin/services ───────────────────────────────────────
describe("GET /api/v1/admin/services", () => {
    it("returns all services including inactive", async () => {
        await seedService({ name: "Active", isActive: true });
        await seedService({ name: "Inactive", isActive: false });
        const r = await request(app).get("/api/v1/admin/services");
        expect(r.status).toBe(200);
        expect(r.body.data.length).toBe(2);
    });

    it("filters inactive only", async () => {
        await seedService({ name: "Active", isActive: true });
        await seedService({ name: "Inactive", isActive: false });
        const r = await request(app).get("/api/v1/admin/services?isActive=false");
        expect(r.body.data.every((s) => !s.isActive)).toBe(true);
    });

    it("returns categories in meta for filter dropdown", async () => {
        await seedService({ category: "Cuts" });
        await seedService({ name: "Keratin", category: "Treatment", price: 3000 });
        const r = await request(app).get("/api/v1/admin/services");
        expect(Array.isArray(r.body.meta.categories)).toBe(true);
        expect(r.body.meta.categories.length).toBeGreaterThan(0);
    });
});

// ─── Admin: POST /api/v1/admin/services ──────────────────────────────────────
describe("POST /api/v1/admin/services", () => {
    const valid = { name: "Blow Dry", description: "Wash + dry", duration: 30, price: 200, category: "Styling" };

    it("creates a service successfully", async () => {
        const r = await request(app).post("/api/v1/admin/services").send(valid);
        expect(r.status).toBe(201);
        expect(r.body.data.name).toBe("Blow Dry");
    });

    it("rejects missing name", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...valid, name: undefined });
        expect(r.status).toBe(400);
    });

    it("rejects duration < 15 min", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...valid, duration: 10 });
        expect(r.status).toBe(400);
    });

    it("rejects negative price", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...valid, price: -50 });
        expect(r.status).toBe(400);
    });

    it("rejects price > 1,00,000", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...valid, price: 200000 });
        expect(r.status).toBe(400);
    });

    it("rejects empty category", async () => {
        const r = await request(app).post("/api/v1/admin/services").send({ ...valid, category: "A" });
        expect(r.status).toBe(400); // min 2 chars
    });
});

// ─── Admin: PUT /api/v1/admin/services/:id ───────────────────────────────────
describe("PUT /api/v1/admin/services/:id", () => {
    it("updates a service", async () => {
        const svc = await seedService();
        const r = await request(app).put(`/api/v1/admin/services/${svc._id}`).send({ price: 999 });
        expect(r.status).toBe(200);
        expect(r.body.data.price).toBe(999);
    });

    it("returns 404 for unknown id", async () => {
        const r = await request(app).put("/api/v1/admin/services/000000000000000000000001").send({ price: 100 });
        expect(r.status).toBe(404);
    });
});

// ─── Admin: DELETE /api/v1/admin/services/:id (soft delete) ──────────────────
describe("DELETE /api/v1/admin/services/:id", () => {
    it("deactivates a service (soft delete)", async () => {
        const svc = await seedService();
        const r = await request(app).delete(`/api/v1/admin/services/${svc._id}`);
        expect(r.status).toBe(200);
        const still = await models.Service.findById(svc._id);
        expect(still.isActive).toBe(false);
    });

    it("returns 404 for unknown id", async () => {
        const r = await request(app).delete("/api/v1/admin/services/000000000000000000000001");
        expect(r.status).toBe(404);
    });
});
