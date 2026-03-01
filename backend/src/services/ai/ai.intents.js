

const INTENT_MAP = [

    { intent: "dashboard_analytics_json", keywords: ["generate dashboard analytics json", "return json chart", "json chart data"] },
    { intent: "dashboard_trend_summary", keywords: ["dashboard summary", "trend summary", "business analysis"] },


    { intent: "revenue_breakdown", keywords: ["revenue by", "breakdown", "category revenue", "which category earns"] },
    { intent: "revenue", keywords: ["revenue", "earning", "income", "money made", "kitna kama", "profit"] },


    { intent: "cancellation_rate", keywords: ["cancellation rate", "how many cancel", "cancel percent", "rate of cancel"] },
    { intent: "list_cancelled", keywords: ["cancelled booking", "list cancel", "who cancel", "cancellation list"] },


    { intent: "upcoming_bookings", keywords: ["upcoming", "tomorrow", "next 7 days", "schedule", "future booking", "kal"] },


    { intent: "staff_performance", keywords: ["staff performance", "staff compare", "who is busiest", "staff stats"] },
    { intent: "staff_images", keywords: ["staff image", "staff photo", "staff portfolio", "show staff", "see staff"] },
    { intent: "top_staff", keywords: ["best staff", "top staff", "most booked staff", "highest booking staff"] },
    { intent: "staff_today", keywords: ["today staff", "who is working today", "today schedule", "staff aaj"] },


    { intent: "service_images", keywords: ["service image", "salon photo", "service portfolio", "show service", "see service"] },
    { intent: "least_booked", keywords: ["least booked", "least popular", "slowest service", "not popular", "zero booking"] },
    { intent: "top_services", keywords: ["popular service", "most booked service", "top service", "best service", "which service"] },


    { intent: "user_images", keywords: ["user image", "customer photo", "user profile", "show user", "see customer"] },


    { intent: "stats_today", keywords: ["today", "aaj", "today count"] },
    { intent: "stats_week", keywords: ["this week", "weekly", "week", "last 7 days", "7 din"] },
    { intent: "stats_month", keywords: ["this month", "monthly", "month", "30 days", "mahina"] },


    { intent: "pending_approvals", keywords: ["pending", "waiting", "not confirmed", "approval needed", "approve"] },


    { intent: "book_appointment", keywords: ["book", "appointment", "schedule", "reserve", "slot", "appointment check", "free time"] },


    { intent: "general_stats", keywords: [] },
];


const detectIntent = (rawQuery) => {
    const q = rawQuery.toLowerCase().trim();


    for (const { intent, keywords } of INTENT_MAP) {
        if (keywords.length && keywords.some((kw) => {

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
