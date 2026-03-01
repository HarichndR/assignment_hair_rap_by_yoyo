const { z } = require("zod");
const { BOOKING_STATUS, SLOT_TYPE } = require("../config/constants");


const STATUS_VALUES = Object.values(BOOKING_STATUS);
const SLOT_TYPES = Object.values(SLOT_TYPE);

const MONGO_ID = z.string().trim().length(24, { message: "Must be a valid 24-character ID" });


const createBookingSchema = z.object({
    userId: MONGO_ID,
    serviceId: MONGO_ID,
    staffId: MONGO_ID,
    date: z.string().trim().refine((d) => !isNaN(Date.parse(d)), { message: "date must be a valid date (YYYY-MM-DD)" }),
    startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "startTime must be HH:mm"),
    notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});


const cancelBookingSchema = z.object({
    userId: MONGO_ID,
    cancellationReason: z
        .string()
        .trim()
        .min(3, "Please provide a brief reason (min 3 characters)")
        .max(500, "Reason cannot exceed 500 characters")
        .optional(),
});


const createSlotSchema = z.object({
    staffId: MONGO_ID,
    date: z
        .string()
        .trim()
        .refine((d) => {
            const parsed = Date.parse(d);
            if (isNaN(parsed)) return false;

            return new Date(d) >= new Date(new Date().toDateString());
        }, { message: "date must be a valid present or future date (YYYY-MM-DD)" }),
    startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "startTime must be in HH:mm format"),
    endTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "endTime must be in HH:mm format"),
    type: z.enum(SLOT_TYPES).default(SLOT_TYPE.AVAILABLE).optional(),
}).refine(
    (d) => d.startTime < d.endTime,
    { message: "endTime must be after startTime", path: ["endTime"] }
);


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
