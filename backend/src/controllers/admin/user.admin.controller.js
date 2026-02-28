const userService = require("../../services/user.service");
const ApiResponse = require("../../utils/ApiResponse");

const getAllUsers = async (req, res, next) => {
    try {
        const result = await userService.listUsers(req.query);
        return new ApiResponse(200, "Users retrieved successfully", result).send(res);
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllUsers };
