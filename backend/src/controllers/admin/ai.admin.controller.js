const aiService = require("../../services/ai.service");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

const chat = async (req, res, next) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== "string" || query.trim().length === 0) {
            return next(new ApiError(400, "query is required"));
        }
        const result = await aiService.chat(query.trim());
        return new ApiResponse(200, "AI response", result).send(res);
    } catch (err) { next(err); }
};

module.exports = { chat };
