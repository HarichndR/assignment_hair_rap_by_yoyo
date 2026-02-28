/**
 * Full Indian Hair Salon Seed — services + stylists with linked service IDs
 * Usage: node src/seeds/salon.seed.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
require("../config/env");

const mongoose = require("mongoose");
const Service = require("../models/service.model");
const Staff = require("../models/staff.model");

// ─── Services ─────────────────────────────────────────────────────────────────
const SERVICES = [
    // Cuts
    { name: "Men's Haircut", category: "Cuts", duration: 30, price: 150, description: "Classic cut with wash and blow-dry" },
    { name: "Women's Haircut", category: "Cuts", duration: 45, price: 300, description: "Precision cut with styling" },
    { name: "Kids' Haircut", category: "Cuts", duration: 20, price: 100, description: "Gentle cut for children under 12" },
    // Styling
    { name: "Blow Dry & Styling", category: "Styling", duration: 30, price: 200, description: "Wash, condition, and blow-dry" },
    { name: "Hair Straightening", category: "Styling", duration: 60, price: 800, description: "Temporary straightening with ceramic plates" },
    { name: "Hair Curling", category: "Styling", duration: 60, price: 700, description: "Soft curls and waves" },
    { name: "Bridal Hairstyle", category: "Styling", duration: 120, price: 3500, description: "Traditional or fusion bridal styling" },
    // Colour
    { name: "Global Hair Color", category: "Colour", duration: 90, price: 1200, description: "Full head single shade colouring" },
    { name: "Highlights", category: "Colour", duration: 120, price: 2200, description: "Balayage or foil highlights" },
    { name: "Root Touch-up", category: "Colour", duration: 60, price: 600, description: "Retouch regrowth" },
    { name: "Henna Color", category: "Colour", duration: 90, price: 450, description: "Natural mehendi for grey coverage" },
    // Treatments
    { name: "Deep Conditioning", category: "Treatment", duration: 45, price: 400, description: "Intense moisture for dry/damaged hair" },
    { name: "Keratin Treatment", category: "Treatment", duration: 120, price: 3000, description: "Smoothening for 3–6 months" },
    { name: "Dandruff Treatment", category: "Treatment", duration: 45, price: 350, description: "Scalp cleanse and anti-dandruff" },
    { name: "Head Massage (Champi)", category: "Treatment", duration: 30, price: 200, description: "Relaxing warm oil massage" },
    // Men's Grooming
    { name: "Beard Trim & Shape", category: "Men", duration: 20, price: 100, description: "Precision beard shaping and line-up" },
    { name: "Clean Shave", category: "Men", duration: 20, price: 80, description: "Hot-towel clean shave" },
    { name: "Men's Facial", category: "Men", duration: 45, price: 400, description: "Basic cleansing facial for men" },
];

// ─── Staff — linked to specific service categories ────────────────────────────
const STAFF_TEMPLATE = [
    {
        name: "Ravi Kumar",
        email: "ravi@thesalon.in",
        phone: "9876543210",
        specialization: "Cuts & Men's Grooming",
        serviceNames: ["Men's Haircut", "Women's Haircut", "Kids' Haircut", "Beard Trim & Shape", "Clean Shave", "Men's Facial"],
    },
    {
        name: "Priya Sharma",
        email: "priya@thesalon.in",
        phone: "9876543211",
        specialization: "Colour & Highlights",
        serviceNames: ["Global Hair Color", "Highlights", "Root Touch-up", "Henna Color", "Deep Conditioning"],
    },
    {
        name: "Arjun Mehta",
        email: "arjun@thesalon.in",
        phone: "9876543212",
        specialization: "Keratin & Treatments",
        serviceNames: ["Keratin Treatment", "Deep Conditioning", "Dandruff Treatment", "Head Massage (Champi)"],
    },
    {
        name: "Sunita Patil",
        email: "sunita@thesalon.in",
        phone: "9876543213",
        specialization: "Bridal & Styling",
        serviceNames: ["Bridal Hairstyle", "Blow Dry & Styling", "Hair Straightening", "Hair Curling", "Women's Haircut"],
    },
    {
        name: "Deepak Nair",
        email: "deepak@thesalon.in",
        phone: "9876543214",
        specialization: "Men's Grooming & Cuts",
        serviceNames: ["Men's Haircut", "Kids' Haircut", "Beard Trim & Shape", "Clean Shave", "Head Massage (Champi)"],
    },
];

const seed = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ── Seed Services ──
    let serviceMap = {};
    const existingServiceCount = await Service.countDocuments();

    if (existingServiceCount === 0) {
        const created = await Service.insertMany(
            SERVICES.map((s) => ({ ...s, isActive: true }))
        );
        created.forEach((s) => { serviceMap[s.name] = s._id; });
        console.log(`✅ Seeded ${created.length} services`);
    } else {
        console.log(`ℹ️  Services already exist (${existingServiceCount}), loading IDs…`);
        const all = await Service.find({}).select("name").lean();
        all.forEach((s) => { serviceMap[s.name] = s._id; });
    }

    // ── Seed Staff ──
    const existingStaffCount = await Staff.countDocuments();

    const DEFAULT_WORKING_HOURS = [
        { day: "monday", startTime: "10:00", endTime: "19:00" },
        { day: "tuesday", startTime: "10:00", endTime: "19:00" },
        { day: "wednesday", startTime: "10:00", endTime: "19:00" },
        { day: "thursday", startTime: "10:00", endTime: "19:00" },
        { day: "friday", startTime: "10:00", endTime: "19:00" },
        { day: "saturday", startTime: "10:00", endTime: "20:00" }, // late on saturday
        { day: "sunday", startTime: "11:00", endTime: "17:00" },   // short sunday
    ];

    if (existingStaffCount === 0) {
        const staffDocs = STAFF_TEMPLATE.map(({ serviceNames, ...rest }) => ({
            ...rest,
            services: serviceNames
                .filter((n) => serviceMap[n])
                .map((n) => serviceMap[n]),
            isAvailable: true,
            workingHours: DEFAULT_WORKING_HOURS,
        }));
        await Staff.insertMany(staffDocs);
        console.log(`✅ Seeded ${staffDocs.length} stylists with working hours`);
    } else {
        console.log(`ℹ️  Staff already exist, ensuring workingHours are present…`);
        await Staff.updateMany(
            { workingHours: { $exists: false } },
            { $set: { workingHours: DEFAULT_WORKING_HOURS } }
        );
    }

    await mongoose.disconnect();
    console.log("✅ Salon seed complete");
};

seed().catch((err) => {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
});
