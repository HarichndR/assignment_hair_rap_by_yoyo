/**
 * Perfect Comprehensive Seed + Images — Services, Staff, Slots, Bookings, User and Settings
 * Usage: node src/seeds/images.seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");
const Slot = require("../models/slot.model");
const Booking = require("../models/booking.model");
const User = require("../models/user.model");
const AppSettings = require("../models/settings.model");
const { BOOKING_STATUS, CANCELLED_BY } = require("../config/constants");

const SERVICES = [
    {
        name: "Men's Haircut", category: "Cuts", duration: 30, price: 150, description: "Classic cut", isActive: true,
        images: [
            { url: "https://res.cloudinary.com/demo/image/upload/v1611000000/hair_cut_m1.jpg", public_id: "hair_cut_m1" },
            { url: "https://res.cloudinary.com/demo/image/upload/v1611000000/hair_cut_m2.jpg", public_id: "hair_cut_m2" }
        ]
    },
    {
        name: "Women's Haircut", category: "Cuts", duration: 45, price: 300, description: "Precision styling", isActive: true,
        images: [
            { url: "https://res.cloudinary.com/demo/image/upload/v1611000000/hair_cut_w1.jpg", public_id: "hair_cut_w1" }
        ]
    },
    {
        name: "Global Hair Color", category: "Colour", duration: 90, price: 1200, description: "Full head", isActive: true,
        images: [
            { url: "https://res.cloudinary.com/demo/image/upload/v1611000000/hair_color1.jpg", public_id: "hair_color1" }
        ]
    }
];

const STAFF_TEMPLATE = [
    {
        name: "Ravi Kumar", email: "ravi@thesalon.in", phone: "9876543210", specialization: "Master Barber", isAvailable: true, serviceNames: ["Men's Haircut"],
        images: [
            { url: "https://res.cloudinary.com/demo/image/upload/v1611000000/barber_ravi.jpg", public_id: "barber_ravi" }
        ]
    },
    {
        name: "Priya Sharma", email: "priya@thesalon.in", phone: "9876543211", specialization: "Senior Stylist", isAvailable: true, serviceNames: ["Women's Haircut", "Global Hair Color"],
        images: [
            { url: "https://res.cloudinary.com/demo/image/upload/v1611000000/stylist_priya.jpg", public_id: "stylist_priya" }
        ]
    }
];

async function seed() {
    try {
        console.log("🚀 Starting Image Seed...");
        await mongoose.connect(process.env.MONGODB_URI);

        // Clear all
        await Promise.all([Service.deleteMany({}), Staff.deleteMany({}), Slot.deleteMany({}), Booking.deleteMany({}), User.deleteMany({}), AppSettings.deleteMany({})]);

        // Seed User
        const user = await User.create({
            name: "Harish Dev",
            email: "harish@example.com",
            phone: "9998887776",
            location: "Bandra, Mumbai",
            image: { url: "https://res.cloudinary.com/demo/image/upload/v1611000000/customer_h.jpg", public_id: "customer_h" }
        });

        // Seed Services
        const services = await Service.insertMany(SERVICES);
        const serviceMap = {};
        services.forEach(s => serviceMap[s.name] = s);

        // Seed Staff
        const staffDocs = STAFF_TEMPLATE.map(s => ({
            ...s,
            services: s.serviceNames.map(name => serviceMap[name]._id)
        }));
        const stylists = await Staff.insertMany(staffDocs);

        console.log("⭐ Image Seed Completed Successfully!");

    } catch (err) {
        console.error("❌ Seed Failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
