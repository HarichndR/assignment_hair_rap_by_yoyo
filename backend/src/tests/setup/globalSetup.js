/**
 * Global setup — starts in-memory MongoDB and sets all required env vars
 * BEFORE any test suite loads modules (so env.js validation passes).
 */
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod;

module.exports = async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Set ALL env vars needed by env.js validation BEFORE any require("../../app")
    process.env.MONGODB_URI = uri;
    process.env.NODE_ENV = "test";
    process.env.PORT = "5001"; // avoid port conflict with dev server
    process.env.JWT_ACCESS_SECRET = "test-jwt-access-secret-min16chars";
    process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret-min16chars";
    process.env.JWT_ACCESS_EXPIRY = "15m";
    process.env.JWT_REFRESH_EXPIRY = "7d";
    process.env.COOKIE_SECRET = "test-cookie-secret-min16chars!!";
    process.env.CORS_ORIGIN = "http://localhost:5173";
    process.env.FRONTEND_URL = "http://localhost:5173";
    // GEMINI_API_KEY intentionally not set — AI tests verify graceful 503

    global.__MONGOD__ = mongod;
};
