const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        specialization: { type: String, trim: true },

        services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],

        isAvailable: { type: Boolean, default: true },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],

        workingHours: [
            {
                day: {
                    type: String,
                    required: true,
                    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                },
                startTime: { type: String, required: true },
                endTime: { type: String, required: true },
            },
        ],
    },
    { timestamps: true }
);

staffSchema.index({ isAvailable: 1, services: 1 });
staffSchema.index({ isAvailable: 1, name: 1 });

module.exports = mongoose.model("Staff", staffSchema);
