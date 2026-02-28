/**
 * AI Service — Smart queries for salon management.
 *
 * This service handles intent detection and fetches data
 * from MongoDB to provide structured insights for the admin.
 */
const axios = require("axios");
const Booking = require("../models/booking.model");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const { startOfToday, daysAgo, daysFromNow, toDateString } = require("../utils/dateHelpers");
const env = require("../config/env");
const { BOOKING_STATUS } = require("../config/constants");

// ─── Gemini Configuration ─────────────────────────────────────────────────────
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
const GEMINI_TIMEOUT_MS = 15_000;
const MAX_QUERY_LENGTH = 500;

// ─── AI Assistant System Prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are the AI assistant for "The Salon." 
Your job is to take the raw salon data provided below and answer the admin's question clearly.

Rules:
1. Only use the data provided. Don't make things up.
2. If there's no data for a question, just say: "No data found for this query yet."
3. Use ₹ for all currency values.
4. Keep the tone professional but helpful.
5. Max 6 sentences per response (unless JSON is requested).
6. IF the intent is "dashboard_analytics_json", you MUST return EXACTLY a valid JSON object matching the requested schema. NO markdown formatting, NO backticks, NO explanation text. Just the raw JSON.
7. IF the intent is "book_appointment", you are a friendly booking assistant for the admin. Your goal is to extract: service, staff, customer (user), date (YYYY-MM-DD), and time (HH:mm). 
8. FOR "book_appointment", return a response that includes a "data" property in JSON if you have extracted enough info, OR ask the user for missing fields. Always be polite.
`.trim();

// ─── Intent Map ───────────────────────────────────────────────────────────────
// Ordered: most specific keywords first. First match wins.
const INTENT_MAP = [
    // Dashboard AI JSON Analytics (Strict JSON format for charts)
    { intent: "dashboard_analytics_json", keywords: ["generate dashboard analytics json", "return json chart", "json chart data"] },
    { intent: "dashboard_trend_summary", keywords: ["dashboard summary", "trend summary", "business analysis"] },
    { intent: "book_appointment", keywords: ["book", "appointment", "schedule", "reserve", "slot", "appointment check", "free time"] },

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

    // Overall summary (fallback)
    { intent: "general_stats", keywords: [] },
];

const detectIntent = (rawQuery) => {
    const q = rawQuery.toLowerCase().trim();
    for (const { intent, keywords } of INTENT_MAP) {
        if (keywords.length && keywords.some((kw) => q.includes(kw))) return intent;
    }
    return "general_stats";
};

// ─── Aggregation Pipeline Helper ──────────────────────────────────────────────
const serviceLookup = { $lookup: { from: "services", localField: "serviceId", foreignField: "_id", as: "service" } };
const staffLookup = { $lookup: { from: "staffs", localField: "staffId", foreignField: "_id", as: "staff" } };

// ─── Context Fetchers ─────────────────────────────────────────────────────────
const CONTEXT_FETCHERS = {

    // ── Dashboard AI Trend Summary (Dynamic Days) ───────────────────────────
    dashboard_trend_summary: async (days = 3) => {
        const startDate = daysAgo(days);
        const [bookings, revenueAgg, newCustomers] = await Promise.all([
            Booking.countDocuments({ date: { $gte: startDate } }),
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED, date: { $gte: startDate } } },
                serviceLookup, { $unwind: "$service" },
                { $group: { _id: null, total: { $sum: "$service.price" } } }
            ]),
            User.countDocuments({ createdAt: { $gte: startDate } })
        ]);

        return {
            period: `Last ${days} days`,
            totalBookings: bookings,
            estimatedRevenue: revenueAgg[0]?.total || 0,
            newCustomers: newCustomers
        };
    },

    // ── Dashboard AI JSON Analytics ─────────────────────────────────────────
    dashboard_analytics_json: async () => {
        // Find top 5 services and top 5 staff for the charts natively instead of relying on AI math
        const [topServices, topStaff] = await Promise.all([
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED } },
                { $group: { _id: "$serviceId", revenue: { $sum: 1 } } }, // Simple count for chart purposes
                { $sort: { revenue: -1 } }, { $limit: 5 },
                serviceLookup, { $unwind: "$service" },
                { $project: { _id: 0, name: "$service.name", value: "$revenue" } }
            ]),
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED } },
                { $group: { _id: "$staffId", bookings: { $sum: 1 } } },
                { $sort: { bookings: -1 } }, { $limit: 5 },
                staffLookup, { $unwind: "$staff" },
                { $project: { _id: 0, name: "$staff.name", value: "$bookings" } }
            ])
        ]);

        return {
            instruction: "Return ONLY a JSON object with two keys: 'topServices' (array of {name, value}) and 'topStaff' (array of {name, value}). Use the provided exact arrays.",
            topServices,
            topStaff
        };
    },

    // ── Revenue total this week ─────────────────────────────────────────────────
    revenue: async () => {
        const weekStart = daysAgo(7);
        const [thisWeek, allTime] = await Promise.all([
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED, date: { $gte: weekStart } } },
                serviceLookup,
                { $unwind: "$service" },
                { $group: { _id: null, total: { $sum: "$service.price" }, count: { $sum: 1 } } },
                { $project: { _id: 0, total: 1, count: 1 } },
            ]),
            Booking.aggregate([
                { $match: { status: BOOKING_STATUS.CONFIRMED } },
                serviceLookup,
                { $unwind: "$service" },
                { $group: { _id: null, total: { $sum: "$service.price" }, count: { $sum: 1 } } },
                { $project: { _id: 0, total: 1, count: 1 } },
            ]),
        ]);
        return {
            thisWeekRevenue: thisWeek[0] || { total: 0, count: 0 },
            allTimeRevenue: allTime[0] || { total: 0, count: 0 },
            period: `${toDateString(weekStart)} to ${toDateString(new Date())}`,
        };
    },

    // ── Revenue breakdown by category ───────────────────────────────────────────
    revenue_breakdown: () =>
        Booking.aggregate([
            { $match: { status: BOOKING_STATUS.CONFIRMED } },
            serviceLookup,
            { $unwind: "$service" },
            { $group: { _id: "$service.category", revenue: { $sum: "$service.price" }, bookings: { $sum: 1 } } },
            { $sort: { revenue: -1 } },
            { $project: { _id: 0, category: "$_id", revenue: 1, bookings: 1 } },
        ]),

    // ── Cancellation rate ────────────────────────────────────────────────────────
    cancellation_rate: async () => {
        const [total, cancelled] = await Promise.all([
            Booking.countDocuments({}),
            Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED }),
        ]);
        const rate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0;
        return { totalBookings: total, cancelledBookings: cancelled, cancellationRate: `${rate}%` };
    },

    // ── Last 10 cancelled bookings ────────────────────────────────────────────
    list_cancelled: () =>
        Booking.find({ status: BOOKING_STATUS.CANCELLED })
            .sort({ updatedAt: -1 }).limit(10)
            .populate("serviceId", "name").populate("userId", "name phone").lean()
            .then((docs) => docs.map((b) => ({
                customer: b.userId?.name || "—",
                phone: b.userId?.phone || "—",
                service: b.serviceId?.name || "—",
                date: toDateString(b.date),
                reason: b.cancellationReason || "No reason given",
                cancelledBy: b.cancelledBy,
            }))),

    // ── Upcoming 7 days ──────────────────────────────────────────────────────
    upcoming_bookings: async () => {
        const today = startOfToday();
        const next7 = daysFromNow(7);
        const bookings = await Booking.find({
            status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
            date: { $gte: today, $lt: next7 },
        })
            .populate("serviceId", "name price").populate("staffId", "name").populate("userId", "name")
            .sort({ date: 1, startTime: 1 }).limit(20).lean();

        return bookings.map((b) => ({
            customer: b.userId?.name || "—",
            service: b.serviceId?.name || "—",
            staff: b.staffId?.name || "—",
            date: toDateString(b.date),
            time: b.startTime,
            status: b.status,
        }));
    },

    // ── Top 5 staff by bookings ───────────────────────────────────────────
    top_staff: () =>
        Booking.aggregate([
            { $match: { status: { $ne: BOOKING_STATUS.CANCELLED } } },
            { $group: { _id: "$staffId", totalBookings: { $sum: 1 } } },
            { $sort: { totalBookings: -1 } }, { $limit: 5 },
            staffLookup,
            { $unwind: "$staff" },
            { $project: { _id: 0, staffName: "$staff.name", specialization: "$staff.specialization", totalBookings: 1 } },
        ]),

    // ── Staff performance (bookings + revenue per staff member) ───────────────────
    staff_performance: () =>
        Booking.aggregate([
            { $match: { status: BOOKING_STATUS.CONFIRMED } },
            serviceLookup, { $unwind: "$service" },
            {
                $group: {
                    _id: "$staffId",
                    bookings: { $sum: 1 },
                    revenue: { $sum: "$service.price" },
                },
            },
            { $sort: { revenue: -1 } },
            staffLookup,
            { $unwind: "$staff" },
            { $project: { _id: 0, staffName: "$staff.name", specialization: "$staff.specialization", bookings: 1, revenue: 1 } },
        ]),

    // ── Staff working today ─────────────────────────────────────────────────
    staff_today: async () => {
        const today = startOfToday();
        const tomorrow = daysFromNow(1);

        // 🚀 aggregation: count slots per staff member directly in DB
        return Booking.aggregate([
            { $match: { date: { $gte: today, $lt: tomorrow } } },
            {
                $group: {
                    _id: "$staffId",
                    bookingCount: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "_id",
                    foreignField: "_id",
                    as: "staff",
                },
            },
            { $unwind: "$staff" },
            {
                $project: {
                    _id: 0,
                    name: "$staff.name",
                    specialization: { $ifNull: ["$staff.specialization", "—"] },
                    slots: "$bookingCount",
                },
            },
        ]);
    },

    // ── Top 5 most-booked services ───────────────────────────────────────────
    top_services: () =>
        Booking.aggregate([
            { $match: { status: { $ne: BOOKING_STATUS.CANCELLED } } },
            { $group: { _id: "$serviceId", totalBookings: { $sum: 1 } } },
            { $sort: { totalBookings: -1 } }, { $limit: 5 },
            serviceLookup, { $unwind: "$service" },
            { $project: { _id: 0, serviceName: "$service.name", category: "$service.category", price: "$service.price", totalBookings: 1 } },
        ]),

    // ── Least-booked / zero-booking services ────────────────────────────────
    least_booked: async () => {
        // 🚀 aggregation: left join services with bookings to find least popular ones
        return Service.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "serviceId",
                    as: "bookings",
                },
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    category: 1,
                    price: 1,
                    bookings: { $size: "$bookings" },
                },
            },
            { $sort: { bookings: 1 } },
            { $limit: 10 },
        ]);
    },

    // ── Today stats ──────────────────────────────────────────────────────────
    stats_today: () => {
        const today = startOfToday();
        return Booking.aggregate([
            { $match: { date: { $gte: today } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } },
        ]);
    },

    // ── This week stats ──────────────────────────────────────────────────────
    stats_week: () =>
        Booking.aggregate([
            { $match: { date: { $gte: daysAgo(7) } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } },
        ]),

    // ── This month stats ─────────────────────────────────────────────────────
    stats_month: () =>
        Booking.aggregate([
            { $match: { date: { $gte: daysAgo(30) } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } },
        ]),

    // ── Pending approvals ─────────────────────────────────────────────────────
    pending_approvals: () =>
        Booking.find({ status: BOOKING_STATUS.PENDING })
            .sort({ createdAt: 1 }).limit(20)
            .populate("serviceId", "name price").populate("staffId", "name").populate("userId", "name phone")
            .lean()
            .then((docs) => docs.map((b) => ({
                customer: b.userId?.name || "—",
                phone: b.userId?.phone || "—",
                service: b.serviceId?.name || "—",
                price: b.serviceId?.price || 0,
                staff: b.staffId?.name || "—",
                date: toDateString(b.date),
                time: b.startTime,
                createdAt: toDateString(b.createdAt),
            }))),

    // ── General overview (fallback) ──────────────────────────────────────────
    general_stats: async () => {
        const [statusCounts, serviceCount, staffCount] = await Promise.all([
            Booking.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { status: "$_id", count: 1, _id: 0 } },
            ]),
            Service.countDocuments({ isActive: true }),
            Staff.countDocuments({ isAvailable: true }),
        ]);
        return { bookingsByStatus: statusCounts, activeServices: serviceCount, activeStaff: staffCount };
    },

    // ── Image/Portfolio Fetchers ──────────────────────────────────────────────
    staff_images: async () => {
        const staff = await Staff.find({ isAvailable: true }).select("name images").lean();
        return staff.map(s => ({
            name: s.name,
            imageCount: (s.images || []).length,
            gallery: (s.images || []).map(img => img.url)
        }));
    },

    service_images: async () => {
        const services = await Service.find({ isActive: true }).select("name images").lean();
        return services.map(s => ({
            name: s.name,
            imageCount: (s.images || []).length,
            gallery: (s.images || []).map(img => img.url)
        }));
    },

    user_images: async () => {
        const users = await User.find({ "image.url": { $exists: true } }).select("name image").limit(10).lean();
        return users.map(u => ({
            name: u.name,
            profileImage: u.image?.url || null
        }));
    },

    // ── Booking Assistant Context ──────────────────────────────────────────
    book_appointment: async () => {
        const [services, staff, users] = await Promise.all([
            Service.find({ isActive: true }).select("name duration").lean(),
            Staff.find({ isAvailable: true }).select("name specialization").lean(),
            User.find().sort({ createdAt: -1 }).limit(10).select("name email phone").lean()
        ]);
        return {
            availableServices: services.map(s => ({ name: s.name, duration: s.duration, id: s._id })),
            availableStaff: staff.map(s => ({ name: s.name, specialization: s.specialization, id: s._id })),
            recentCustomers: users.map(u => ({ name: u.name, id: u._id, contact: u.phone || u.email })),
            today: toDateString(startOfToday()),
            instruction: "Extract: service, staff, customer (user), date, time. Match names to the IDs provided. If customer is new or not in list, use 'NEW_CUSTOMER' as ID and extract their name."
        };
    },
};

// ─── Main Chat Function ───────────────────────────────────────────────────────
const chat = async (rawQuery) => {
    if (!rawQuery?.trim()) throw new ApiError(400, "Query cannot be empty");
    if (!env.GEMINI_API_KEY) {
        throw new ApiError(503, "AI assistant is not configured. Add GEMINI_API_KEY to your .env file.");
    }

    // Sanitise query before sending to model
    const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
    const intent = detectIntent(query);

    logger.debug(`[Assistant] intent="${intent}" query="${query.slice(0, 60)}"`);

    let days = 3; // default for trend summary
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

    const { data } = await axios.post(
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

    let answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!answer) throw new ApiError(502, "AI returned an empty response. Please try again.");

    // Parse JSON strictly if it's the dashboard analytics intent or book_appointment
    if (intent === "dashboard_analytics_json" || intent === "book_appointment") {
        try {
            // Strip markdown block if Gemini wraps it
            if (answer.startsWith("```json")) answer = answer.replace(/```json/g, "").replace(/```/g, "").trim();
            if (answer.startsWith("```")) answer = answer.replace(/```/g, "").trim();

            // For book_appointment, we want to extract the JSON part and the natural text separately if possible,
            // or just ensure the whole thing is valid if AI was told to return a 'data' property.
            if (intent === "book_appointment") {
                // If it's a mix of text and JSON, we might need more complex parsing, 
                // but let's assume for now the AI is disciplined.
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

module.exports = { chat, detectIntent };
