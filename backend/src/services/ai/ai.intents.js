/**
 * AI Intents — Mapping user queries to database context fetchers.
 */

const INTENT_MAP = [
    // Dashboard AI JSON Analytics (Strict JSON format for charts)
    { intent: "dashboard_analytics_json", keywords: ["generate dashboard analytics json", "return json chart", "json chart data"] },
    { intent: "dashboard_trend_summary", keywords: ["dashboard summary", "trend summary", "business analysis"] },

    // Revenue & Money
    { intent: "revenue_breakdown", keywords: ["revenue by", "breakdown", "category revenue", "which category earns"] },
    { intent: "revenue", keywords: ["revenue", "earning", "income", "money made", "kitna kama", "profit"] },

    // Cancellations
    { intent: "cancellation_rate", keywords: ["cancellation rate", "how many cancel", "cancel percent", "rate of cancel"] },
    { intent: "list_cancelled", keywords: ["cancelled booking", "list cancel", "who cancel", "cancellation list"] },

    // Upcoming
    { intent: "upcoming_bookings", keywords: ["upcoming", "tomorrow", "next 7 days", "schedule", "future booking", "kal"] },

    // Staff
    { intent: "staff_performance", keywords: ["staff performance", "staff compare", "who is busiest", "staff stats"] },
    { intent: "staff_images", keywords: ["staff image", "staff photo", "staff portfolio", "show staff", "see staff"] },
    { intent: "top_staff", keywords: ["best staff", "top staff", "most booked staff", "highest booking staff"] },
    { intent: "staff_today", keywords: ["today staff", "who is working today", "today schedule", "staff aaj"] },

    // Services
    { intent: "service_images", keywords: ["service image", "salon photo", "service portfolio", "show service", "see service"] },
    { intent: "least_booked", keywords: ["least booked", "least popular", "slowest service", "not popular", "zero booking"] },
    { intent: "top_services", keywords: ["popular service", "most booked service", "top service", "best service", "which service"] },

    // Users
    { intent: "user_images", keywords: ["user image", "customer photo", "user profile", "show user", "see customer"] },

    // Time-based stats
    { intent: "stats_today", keywords: ["today", "aaj", "today count"] },
    { intent: "stats_week", keywords: ["this week", "weekly", "week", "last 7 days", "7 din"] },
    { intent: "stats_month", keywords: ["this month", "monthly", "month", "30 days", "mahina"] },

    // Pending approvals
    { intent: "pending_approvals", keywords: ["pending", "waiting", "not confirmed", "approval needed", "approve"] },

    // Booking Assistant (Lower priority, matches greedy keywords like 'book')
    { intent: "book_appointment", keywords: ["book", "appointment", "schedule", "reserve", "slot", "appointment check", "free time"] },

    // Overall summary (fallback)
    { intent: "general_stats", keywords: [] },
];

/**
 * Detects the intent of a raw user query.
 * 
 * @param {string} rawQuery 
 * @returns {string} The detected intent key
 */
const detectIntent = (rawQuery) => {
    const q = rawQuery.toLowerCase().trim();

    // Check for exact word boundaries for greedy keywords like "book"
    for (const { intent, keywords } of INTENT_MAP) {
        if (keywords.length && keywords.some((kw) => {
            // If keyword is short (like 'book'), use regex for word boundary
            if (kw.length <= 4) {
                const regex = new RegExp(`\\b${kw}\\b`, 'i');
                return regex.test(q);
            }
            return q.includes(kw);
        })) return intent;
    }
    return "general_stats";
};

module.exports = { detectIntent, INTENT_MAP };
