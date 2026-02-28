const mongoose = require("mongoose");
const { BOOKING_STATUS, CANCELLED_BY } = require("../config/constants");

const bookingSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
        // slotId is now optional, as we use dynamic time logic
        slotId: { type: mongoose.Schema.Types.ObjectId, ref: "AvailabilitySlot", required: false },
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        status: {
            type: String,
            enum: Object.values(BOOKING_STATUS),
            default: BOOKING_STATUS.PENDING,
        },
        notes: { type: String, trim: true },
        cancelledBy: {
            type: String,
            enum: Object.values(CANCELLED_BY),
            default: null,
        },
        cancellationReason: { type: String, default: null },
    },
    { timestamps: true }
);

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ staffId: 1, date: 1, startTime: 1 }, { unique: true });
bookingSchema.index({ status: 1, date: 1 });
bookingSchema.index({ date: 1, startTime: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
