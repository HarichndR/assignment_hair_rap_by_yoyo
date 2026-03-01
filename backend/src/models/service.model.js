const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        duration: { type: Number, required: true, min: 15 },
        price: { type: Number, required: true, min: 0 },
        category: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: true },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
            },
        ],
    },
    { timestamps: true }
);

serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1, category: 1 });
serviceSchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.model("Service", serviceSchema);
