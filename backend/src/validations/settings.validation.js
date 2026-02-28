const { z } = require("zod");

const updateSettingsSchema = z.object({
    cancellationWindowHours: z.number().int().min(0).optional(),
    bookingConfirmationRequired: z.boolean().optional(),
    salonStartTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional(),
    salonEndTime: z.string().trim().regex(/^\d{2}:\d{2}$/).optional(),
});

module.exports = { updateSettingsSchema };
