const rateLimit = require("express-rate-limit");
const ApiResponse = require("../utils/ApiResponse");

const createLimiter = (windowMs, max, message) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) =>
            new ApiResponse(429, message || "Too many requests, please try again later.").send(res),
    });

const limiters = {
    adminLogin: createLimiter(15 * 60 * 1000, 10, "Too many login attempts. Try again in 15 minutes."),
    register: createLimiter(60 * 60 * 1000, 5, "Too many registration attempts. Try again in an hour."),
    booking: createLimiter(60 * 1000, 20, "Too many booking requests."),
    aiChat: createLimiter(60 * 1000, 15, "AI request limit reached. Please wait a moment."),
    global: createLimiter(60 * 1000, 100),
};

module.exports = limiters;
