require("dotenv").config();
const { connectDB, closeDB } = require("./src/config/db");
const aiService = require("./src/services/ai.service");

async function verifyAI() {
    console.log("=== AI MULTI-QUERY VERIFICATION ===");
    try {
        await connectDB();

        const questions = [
            "What is our total revenue from men's haircuts?",
            "Who is our top performing stylist?",
            "How many bookings do we have for tomorrow?",
            "Which staff members can do a Keratin Treatment?",
            "Are there any cancelled bookings I should know about?"
        ];

        for (const q of questions) {
            console.log(`\n- User: "${q}"`);
            const res = await aiService.chat(q);
            console.log(`  Intent: ${res.intent}`);
            console.log(`  AI: "${res.answer}"`);
        }

    } catch (err) {
        console.error("❌ AI Verification Failed:", err.message);
    } finally {
        await closeDB();
    }
    console.log("\n====================================");
}

verifyAI();
