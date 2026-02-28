require("dotenv").config();
const mongoose = require("mongoose");
const Service = require("./src/models/service.model");
const Staff = require("./src/models/staff.model");
const User = require("./src/models/user.model");
const aiService = require("./src/services/ai.service");

async function verifyModels() {
    try {
        console.log("=== MODEL IMAGE SUPPORT CHECK ===");
        const service = new Service({ name: "Test", duration: 30, price: 100, category: "Test", images: [{ url: "http://test.com/1.jpg", public_id: "1" }] });
        console.log(`✅ Service model supports images: ${Array.isArray(service.images)}`);

        const staff = new Staff({ name: "Test Staff", email: "test@staff.com", images: [{ url: "http://test.com/2.jpg", public_id: "2" }] });
        console.log(`✅ Staff model supports images: ${Array.isArray(staff.images)}`);

        const user = new User({ name: "Test User", email: "test@user.com", images: [{ url: "http://test.com/3.jpg", public_id: "3" }] });
        console.log(`✅ User model re-introduced and supports images: ${Array.isArray(user.images)}`);

        console.log("\n=== AI INTENT VERIFICATION (Images) ===");
        const queries = [
            "show me portfolio of Ravi",
            "can I see images of root touch up?",
            "show me customer profile photos"
        ];

        for (const q of queries) {
            const intent = aiService.detectIntent(q);
            console.log(`- Query: "${q}" -> Intent: ${intent}`);
        }

    } catch (err) {
        console.error("❌ Verification Failed:", err.message);
    }
}

verifyModels();
