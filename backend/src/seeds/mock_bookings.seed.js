require("dotenv").config();
const mongoose = require("mongoose");
const Staff = require("../models/staff.model");
const Service = require("../models/service.model");
const User = require("../models/user.model");
const Booking = require("../models/booking.model");

const generateRandomBookings = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for mock seeding...");

        // 1. Fetch available entities
        const staffs = await Staff.find();
        const services = await Service.find();
        let users = await User.find();

        if (!staffs.length || !services.length) {
            console.log("Please run `npm run seed:salon` to populate Staff and Services first.");
            process.exit(1);
        }

        if (!users.length) {
            console.log("No customers found. Creating a few dummy customers...");
            const dummyUsers = [
                { name: "Alice Smith", email: "alice@example.com", phone: "1234567890" },
                { name: "Bob Jones", email: "bob@example.com", phone: "0987654321" },
                { name: "Charlie Brown", email: "charlie@example.com", phone: "5551234567" }
            ];
            await User.insertMany(dummyUsers);
            users = await User.find();
        }

        // 2. Make all staff available all week
        console.log("Updating all staff to be fully available 9 AM - 6 PM...");
        const fullWeekSchedule = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => ({
            day,
            startTime: "09:00",
            endTime: "18:00"
        }));

        for (let staff of staffs) {
            staff.isAvailable = true;
            staff.workingHours = fullWeekSchedule;
            // Ensure they have all services if they don't have enough
            if (!staff.services.length) {
                staff.services = [services[0]._id, services[1] ? services[1]._id : null].filter(Boolean);
            }
            await staff.save();
        }
        console.log("Staff updated successfully.");

        // Clear future bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Booking.deleteMany({ date: { $gte: today } });
        console.log("Cleared upcoming bookings to start fresh.");

        // 3. Generate random bookings for next 8 days
        const statuses = ["pending", "confirmed", "confirmed"];
        const mockBookings = [];

        const addMinutes = (timeStr, mins) => {
            let [h, m] = timeStr.split(":").map(Number);
            m += mins;
            h += Math.floor(m / 60);
            m = m % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        let totalCreated = 0;

        for (let i = 0; i <= 8; i++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + i);
            targetDate.setHours(0, 0, 0, 0);

            for (const staff of staffs) {
                // Determine 1-4 random bookings per staff per day
                const bookingsCount = Math.floor(Math.random() * 4) + 1;

                let currentTime = "09:00";

                for (let b = 0; b < bookingsCount; b++) {
                    const service = services[Math.floor(Math.random() * services.length)];
                    const user = users[Math.floor(Math.random() * users.length)];

                    const durationMins = service.duration || 60;

                    // Add random gap between bookings for THIS staff member
                    const gapMins = (Math.floor(Math.random() * 3) + 1) * 15;
                    const startTime = addMinutes(currentTime, gapMins);
                    const endTime = addMinutes(startTime, durationMins);

                    if (endTime > "18:00") break;

                    mockBookings.push({
                        userId: user._id,
                        serviceId: service._id,
                        staffId: staff._id,
                        date: targetDate,
                        startTime: startTime,
                        endTime: endTime,
                        status: statuses[Math.floor(Math.random() * statuses.length)]
                    });

                    currentTime = endTime;
                    totalCreated++;
                }
            }
        }

        await Booking.insertMany(mockBookings);
        console.log(`Successfully seeded ${totalCreated} random bookings!`);

    } catch (error) {
        console.error("Error generating bookings:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

generateRandomBookings();
