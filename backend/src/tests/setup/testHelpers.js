/**
 * Shared test helper — connects Mongoose to the in-memory MongoDB,
 * exposes the Express app, seeds initial data, and cleans up between tests.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../../.env") });

const mongoose = require("mongoose");
const request = require("supertest");

// import models for seeding
const Service = require("../../models/service.model");
const Staff = require("../../models/staff.model");
const Booking = require("../../models/booking.model");

// ---------- DB connection ----------
const connectTestDB = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }
};

const disconnectTestDB = async () => {
    await mongoose.disconnect();
};

const clearCollections = async (...models) => {
    await Promise.all(models.map((m) => m.deleteMany({})));
};

// ---------- Seed helpers ----------
const seedService = (overrides = {}) =>
    Service.create({
        name: "Men's Haircut",
        category: "Cuts",
        duration: 30,
        price: 150,
        description: "Classic cut",
        isActive: true,
        ...overrides,
    });

const seedStaff = (serviceIds = [], overrides = {}) =>
    Staff.create({
        name: "Ravi Kumar",
        email: `ravi-${Math.random()}@thesalon.in`,
        phone: "9876543210",
        specialization: "Cuts",
        services: serviceIds,
        isAvailable: true,
        workingHours: [
            { day: "monday", startTime: "09:00", endTime: "18:00" },
            { day: "tuesday", startTime: "09:00", endTime: "18:00" },
            { day: "wednesday", startTime: "09:00", endTime: "18:00" },
            { day: "thursday", startTime: "09:00", endTime: "18:00" },
            { day: "friday", startTime: "09:00", endTime: "18:00" },
            { day: "saturday", startTime: "09:00", endTime: "18:00" },
            { day: "sunday", startTime: "09:00", endTime: "18:00" },
        ],
        ...overrides,
    });

const seedBooking = (userId, serviceId, staffId, overrides = {}) =>
    Booking.create({
        userId,
        serviceId,
        staffId,
        date: new Date().toISOString().split("T")[0],
        startTime: "10:00",
        endTime: "10:30",
        status: "pending",
        ...overrides,
    });

module.exports = {
    connectTestDB,
    disconnectTestDB,
    clearCollections,
    seedService,
    seedStaff,
    seedBooking,
    models: { Service, Staff, Booking },
};
