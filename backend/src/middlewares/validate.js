const ApiError = require("../utils/ApiError");


const validate = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const errors = result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        }));
        return next(new ApiError(400, "Validation failed", errors));
    }
    req[source] = result.data;
    next();
};

module.exports = validate;
