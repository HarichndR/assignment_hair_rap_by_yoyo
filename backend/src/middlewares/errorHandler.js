const logger = require("../utils/logger");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");


const errorHandler = (err, req, res, next) => {
    logger.error(`${err.message}${err.stack ? `\n${err.stack}` : ""}`);


    if (err instanceof ApiError && err.isOperational) {
        return new ApiResponse(err.statusCode, err.message, null, {
            errors: err.errors,
        }).send(res);
    }


    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return new ApiResponse(400, "Validation failed", null, { errors }).send(res);
    }


    if (err.name === "CastError") {
        return new ApiResponse(400, `Invalid ${err.path}: ${err.value}`).send(res);
    }


    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return new ApiResponse(409, `${field} already exists`).send(res);
    }


    if (err.name === "JsonWebTokenError") {
        return new ApiResponse(401, "Invalid token").send(res);
    }
    if (err.name === "TokenExpiredError") {
        return new ApiResponse(401, "Token expired").send(res);
    }


    const isDev = process.env.NODE_ENV === "development";
    return new ApiResponse(
        500,
        isDev ? err.message : "Something went wrong. Please try again."
    ).send(res);
};

module.exports = errorHandler;
