const analyticsService = require("../../services/analytics.service");
const ApiResponse = require("../../utils/ApiResponse");

const getDashboardAnalytics = async (req, res, next) => {
    try {
        const data = await analyticsService.getDashboardStats();
        return new ApiResponse(200, "Dashboard analytics fetched", data).send(res);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDashboardAnalytics
};
