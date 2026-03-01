require("dotenv").config();
const mongoose = require("mongoose");
const { chat } = require("./src/services/ai.service");

const testDashboardSummaryV2 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");

        const q = "Provide a big, comprehensive business analysis report for the last 3 days. Include key trends, revenue breakdown insights, customer growth analysis, staff performance highlights, and 3 specific strategic recommendations for improvement. Use HTML tags (<h3>, <p>, <strong>, <ul>, <li>) for formatting; do NOT use markdown stars or hashes.";
        console.log(`Testing query with HTML instructions...`);

        const res = await chat(q);
        console.log("\n--- AI Response ---");
        console.log("Intent:", res.intent);
        console.log("Contains HTML Tags (h3, p, strong):", res.answer.includes("<") && res.answer.includes(">"));
        console.log("Contains Markdown (**, ###):", res.answer.includes("**") || res.answer.includes("###"));
        console.log("\nPreview (First 500 chars):");
        console.log(res.answer.slice(0, 500));
        console.log("-------------------\n");

    } catch (e) {
        console.error("TEST ERROR:", e.message);
    } finally {
        process.exit(0);
    }
};

testDashboardSummaryV2();
