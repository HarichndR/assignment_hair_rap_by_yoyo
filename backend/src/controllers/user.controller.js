const User = require("../models/user.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const createUser = async (req, res, next) => {
    try {
        const user = await User.create(req.body);
        return new ApiResponse(201, "User created successfully", user).send(res);
    } catch (err) { next(err); }
};

const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) throw new ApiError(404, "User not found");
        return new ApiResponse(200, "User profile fetched", user).send(res);
    } catch (err) { next(err); }
};

const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!user) throw new ApiError(404, "User not found");
        return new ApiResponse(200, "User profile updated", user).send(res);
    } catch (err) { next(err); }
};

module.exports = { createUser, getUserProfile, updateUserProfile };
