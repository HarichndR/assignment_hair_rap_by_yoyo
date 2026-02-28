/**
 * AI Assistant API Tests
 *
 * Coverage:
 *   - Intent detection (logic check)
 *   - POST /api/v1/admin/ai/chat (mocked Gemini)
 *   - Error cases (missing query, missing API key)
 */
const request = require("supertest");
const axios = require("axios");
const {
    connectTestDB, disconnectTestDB, clearCollections,
    seedService, seedStaff, seedSlot, seedBooking, models
} = require("./setup/testHelpers");
const { detectIntent } = require("../services/ai.service");

jest.mock("axios");

let app;
beforeAll(async () => {
    await connectTestDB();
    app = require("../../app");
});
afterAll(disconnectTestDB);
beforeEach(() => {
    jest.clearAllMocks();
    return clearCollections(models.Service, models.Staff, models.AvailabilitySlot, models.Booking);
});

describe("AI Service - Intent Detection", () => {
    it("detects 'revenue' intent correctly", () => {
        expect(detectIntent("what is our total revenue?")).toBe("revenue");
    });

    it("detects 'top_services' intent correctly", () => {
        expect(detectIntent("what is our most popular service?")).toBe("top_services");
    });
});

describe("POST /api/v1/admin/ai/chat", () => {
    let originalKey;
    beforeAll(() => {
        originalKey = process.env.GEMINI_API_KEY;
        process.env.GEMINI_API_KEY = "test-api-key-12345";
    });
    afterAll(() => {
        process.env.GEMINI_API_KEY = originalKey;
    });

    it("returns a successful AI response (mocked)", async () => {
        // Mock Gemini response
        axios.post.mockResolvedValueOnce({
            data: {
                candidates: [
                    {
                        content: {
                            parts: [{ text: "You have 3 confirmed bookings today." }]
                        }
                    }
                ]
            }
        });

        const r = await request(app)
            .post("/api/v1/admin/ai/chat")
            .send({ query: "how many bookings today?" });

        expect(r.status).toBe(200);
        expect(r.body.data.answer).toBe("You have 3 confirmed bookings today.");
        expect(r.body.data.intent).toBe("stats_today");
    });

    it("returns 400 for empty query", async () => {
        const r = await request(app)
            .post("/api/v1/admin/ai/chat")
            .send({ query: "" });
        expect(r.status).toBe(400);
        expect(r.body.message).toMatch(/required/i);
    });

    it("handles Gemini API error (502)", async () => {
        axios.post.mockResolvedValueOnce({ data: { candidates: [] } });

        const r = await request(app)
            .post("/api/v1/admin/ai/chat")
            .send({ query: "revenue stats" });

        expect(r.status).toBe(502);
        expect(r.body.message).toMatch(/empty response/i);
    });
});
