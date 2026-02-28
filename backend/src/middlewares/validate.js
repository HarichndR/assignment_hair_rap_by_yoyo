const ApiError = require("../utils/ApiError");

/**
 * Returns an Express middleware that validates req[source] against a Zod schema.
 * Source can be 'body', 'query', or 'params'. Defaults to 'body'.
 */
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
