const express = require("express");
const analyticsController = require("../../controllers/admin/analytics.admin.controller");

const router = express.Router();

router.get("/dashboard", analyticsController.getDashboardAnalytics);

module.exports = router;
