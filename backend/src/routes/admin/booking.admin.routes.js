const express = require("express");
const bookingController = require("../../controllers/admin/booking.admin.controller");
const validate = require("../../middlewares/validate");
const { updateBookingStatusSchema } = require("../../validations/booking.validation");

const router = express.Router();


router.get("/", bookingController.getAllBookings);


router.patch("/:id/status", validate(updateBookingStatusSchema), bookingController.updateBookingStatus);

module.exports = router;
