const axios = require("axios");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const env = require("../config/env");

const { detectIntent } = require("./ai/ai.intents");
const { SYSTEM_PROMPT } = require("./ai/ai.prompts");
const { CONTEXT_FETCHERS } = require("./ai/ai.fetchers");

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
const GEMINI_TIMEOUT_MS = 15_000;
const MAX_QUERY_LENGTH = 500;

const chat = async (rawQuery) => {
    if (!rawQuery?.trim()) throw new ApiError(400, "Query cannot be empty");
    if (!env.GEMINI_API_KEY) {
        throw new ApiError(503, "AI assistant is not configured. Add GEMINI_API_KEY to your .env file.");
    }

    const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
    const intent = detectIntent(query);

    logger.debug(`[Assistant] intent="${intent}" query="${query.slice(0, 60)}"`);

    let days = 3;
    if (intent === "dashboard_trend_summary") {
        const match = query.match(/last (\d+) days/i);
        if (match && match[1]) days = parseInt(match[1], 10);
    }

    const fetcher = CONTEXT_FETCHERS[intent] ?? CONTEXT_FETCHERS.general_stats;
    const contextData = await fetcher(days);

    const userMessage = [
        `Admin question: "${query}"`,
        ``,
        `Data context (from database):`,
        JSON.stringify(contextData, null, 2),
    ].join("\n");

    let result;
    try {
        result = await axios.post(
            `${GEMINI_URL}?key=${env.GEMINI_API_KEY}`,
            {
                contents: [
                    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                    { role: "model", parts: [{ text: "Understood. I will only answer based on the provided salon database context." }] },
                    { role: "user", parts: [{ text: userMessage }] },
                ],
            },
            { timeout: GEMINI_TIMEOUT_MS }
        );
    } catch (err) {
        if (err.response?.status === 429) {
            throw new ApiError(429, "AI Quota Exceeded. The free tier of Gemini API has a limit. Please try again in 1 minute or check your Google AI Studio billing.");
        }
        if (err.response?.status === 400) {
            logger.error("AI Request Error (400):", err.response.data);
            throw new ApiError(400, "The AI couldn't process this request. It might be too large or invalid.");
        }
        throw new ApiError(502, "AI service failed to respond. Please check your connection.");
    }

    let answer = result.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!answer) throw new ApiError(502, "AI returned an empty response. Please try again.");

    if (intent === "dashboard_analytics_json" || intent === "book_appointment") {
        try {
            if (answer.startsWith("```json")) answer = answer.replace(/```json/g, "").replace(/```/g, "").trim();
            if (answer.startsWith("```")) answer = answer.replace(/```/g, "").trim();

            if (intent === "book_appointment") {
                const jsonMatch = answer.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const extracted = JSON.parse(jsonMatch[0]);
                    return { answer: answer.replace(jsonMatch[0], "").trim(), intent, query, extracted };
                }
            } else {
                JSON.parse(answer);
            }
        } catch (e) {
            logger.error(`AI JSON Parse Error: ${e.message}`, { raw: answer });
            if (intent === "dashboard_analytics_json") {
                answer = JSON.stringify({
                    topServices: contextData.topServices || [],
                    topStaff: contextData.topStaff || []
                });
            }
        }
    }

    return { answer, intent, query };
};

module.exports = { chat, detectIntent, CONTEXT_FETCHERS };
