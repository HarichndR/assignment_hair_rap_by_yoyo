const ApiError = require("../utils/ApiError");
const { ROLES } = require("../config/constants");

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== ROLES.ADMIN) {
        return next(new ApiError(403, "Admin access required"));
    }
    next();
};

module.exports = adminOnly;
