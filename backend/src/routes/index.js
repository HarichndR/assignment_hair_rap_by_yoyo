const express = require("express");
const limiter = require("../middlewares/rateLimiter");

const serviceRoutes = require("./service.routes");
const bookingRoutes = require("./booking.routes");

const adminServiceRoutes = require("./admin/service.admin.routes");
const adminStaffRoutes = require("./admin/staff.admin.routes");
const adminBookingRoutes = require("./admin/booking.admin.routes");
const adminAiRoutes = require("./admin/ai.admin.routes");
const adminSettingsRoutes = require("./admin/settings.admin.routes");
const adminUploadRoutes = require("./admin/upload.admin.routes");
const adminSearchRoutes = require("./admin/search.admin.routes");
const adminUserRoutes = require("./admin/user.admin.routes");
const adminAnalyticsRoutes = require("./admin/analytics.admin.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

// Global rate limiter
router.use(limiter.global);

// Public routes
router.use("/services", serviceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/users", userRoutes);

// Admin routes — auth removed
router.use("/admin/services", adminServiceRoutes);
router.use("/admin/staff", adminStaffRoutes);
router.use("/admin/bookings", adminBookingRoutes);
router.use("/admin/ai", adminAiRoutes);
router.use("/admin/settings", adminSettingsRoutes);
router.use("/admin/upload", adminUploadRoutes);
router.use("/admin/search", adminSearchRoutes);
router.use("/admin/users", adminUserRoutes);
router.use("/admin/analytics", adminAnalyticsRoutes);



module.exports = router;

