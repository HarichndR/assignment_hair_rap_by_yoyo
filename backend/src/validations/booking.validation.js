const { z } = require("zod");
const { BOOKING_STATUS, SLOT_TYPE } = require("../config/constants");

// Re-use enums from constants — single source of truth
const STATUS_VALUES = Object.values(BOOKING_STATUS); // ["pending", "confirmed", "cancelled"]
const SLOT_TYPES = Object.values(SLOT_TYPE);       // ["available", "booked", "blocked"]

const MONGO_ID = z.string().trim().length(24, { message: "Must be a valid 24-character ID" });

// POST /bookings — customer creates a booking
const createBookingSchema = z.object({
    userId: MONGO_ID, // Required since auth is removed
    serviceId: MONGO_ID,
    staffId: MONGO_ID,
    date: z.string().trim().refine((d) => !isNaN(Date.parse(d)), { message: "date must be a valid date (YYYY-MM-DD)" }),
    startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "startTime must be HH:mm"),
    notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

// PATCH /bookings/:id/cancel
const cancelBookingSchema = z.object({
    userId: MONGO_ID, // Required since auth is removed
    cancellationReason: z
        .string()
        .trim()
        .min(3, "Please provide a brief reason (min 3 characters)")
        .max(500, "Reason cannot exceed 500 characters")
        .optional(),
});

// POST /admin/bookings/slots — admin creates an availability slot
const createSlotSchema = z.object({
    staffId: MONGO_ID,
    date: z
        .string()
        .trim()
        .refine((d) => {
            const parsed = Date.parse(d);
            if (isNaN(parsed)) return false;
            // Must not be in the past
            return new Date(d) >= new Date(new Date().toDateString());
        }, { message: "date must be a valid present or future date (YYYY-MM-DD)" }),
    startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "startTime must be in HH:mm format"),
    endTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "endTime must be in HH:mm format"),
    type: z.enum(SLOT_TYPES).default(SLOT_TYPE.AVAILABLE).optional(),
}).refine(
    (d) => d.startTime < d.endTime,
    { message: "endTime must be after startTime", path: ["endTime"] }
);

// PATCH /admin/bookings/:id/status
const updateBookingStatusSchema = z.object({
    status: z.enum(STATUS_VALUES, {
        errorMap: () => ({ message: `status must be one of: ${STATUS_VALUES.join(", ")}` }),
    }),
    cancellationReason: z
        .string()
        .trim()
        .max(500, "Reason cannot exceed 500 characters")
        .optional(),
});

// GET /services/:id/availability?date=YYYY-MM-DD
const getSlotsSchema = z.object({
    date: z
        .string()
        .trim()
        .refine((d) => !isNaN(Date.parse(d)), { message: "date must be a valid date (YYYY-MM-DD)" }),
});

module.exports = {
    createBookingSchema,
    cancelBookingSchema,
    createSlotSchema,
    updateBookingStatusSchema,
    getSlotsSchema,
};
