const settingsService = require("../../services/settings.service");
const ApiResponse = require("../../utils/ApiResponse");

const getSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.getSettings();
        return new ApiResponse(200, "Settings fetched", settings).send(res);
    } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.updateSettings(req.body);
        return new ApiResponse(200, "Settings updated", settings).send(res);
    } catch (err) { next(err); }
};

module.exports = { getSettings, updateSettings };
