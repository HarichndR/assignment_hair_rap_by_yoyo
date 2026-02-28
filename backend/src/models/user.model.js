const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        location: { type: String, trim: true },
        // Multi-image support (e.g. Profile, ID docs, Salon visit photos)
        // Single profile image support
        image: {
            url: { type: String },
            public_id: { type: String },
        },
    },
    { timestamps: true }
);

userSchema.index({ phone: 1 });

module.exports = mongoose.model("User", userSchema);
