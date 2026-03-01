
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
require("../config/env");

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { ROLES, OAUTH_PROVIDERS } = require("../config/constants");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bookingapp.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "Super Admin";

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        console.log(`Admin already exists: ${ADMIN_EMAIL}`);
        await mongoose.disconnect();
        return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: ROLES.ADMIN,
        oauthProvider: OAUTH_PROVIDERS.LOCAL,
    });

    console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
};

seed().catch((err) => {
    console.error("Seed error:", err.message);
    process.exit(1);
});
