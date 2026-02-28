/**
 * envSetup.js — runs in each test worker BEFORE any test file loads.
 * Loads .env.test so env.js Zod schema validation passes.
 * The MONGODB_URI placeholder will be overridden by globalSetup's MongoMemoryServer URI.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../../.env.test") });
