const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
    {
        _id: { type: String, default: "app_settings" },
        cancellationWindowHours: { type: Number, default: 24, min: 0 },
        bookingConfirmationRequired: { type: Boolean, default: false },
        salonStartTime: { type: String, default: "09:00" },
        salonEndTime: { type: String, default: "21:00" },
    },
    { timestamps: true }
);


settingsSchema.statics.getSingleton = async function () {
    let settings = await this.findById("app_settings");
    if (!settings) {
        settings = await this.create({ _id: "app_settings" });
    }
    return settings;
};

module.exports = mongoose.model("AppSettings", settingsSchema);
