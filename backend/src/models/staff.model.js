const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        specialization: { type: String, trim: true },
        // Services this staff member performs — links to Service documents
        services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
        // isAvailable: true = accepting bookings; false = on leave or inactive
        isAvailable: { type: Boolean, default: true },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
        // Dynamic Slotting: Working hours for each day of the week
        workingHours: [
            {
                day: {
                    type: String,
                    required: true,
                    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                },
                startTime: { type: String, required: true }, // "09:00"
                endTime: { type: String, required: true },   // "18:00"
            },
        ],
    },
    { timestamps: true }
);

staffSchema.index({ isAvailable: 1, services: 1 });
staffSchema.index({ isAvailable: 1, name: 1 });

module.exports = mongoose.model("Staff", staffSchema);
