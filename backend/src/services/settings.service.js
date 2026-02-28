const AppSettings = require("../models/settings.model");

const getSettings = async () => AppSettings.getSingleton();

const updateSettings = async (data) => {
    const settings = await AppSettings.getSingleton();
    Object.assign(settings, data);
    await settings.save();
    return settings;
};

module.exports = { getSettings, updateSettings };
