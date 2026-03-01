const express = require("express");
const settingsController = require("../../controllers/admin/settings.admin.controller");
const validate = require("../../middlewares/validate");
const { updateSettingsSchema } = require("../../validations/settings.validation");

const router = express.Router();


router.get("/", settingsController.getSettings);


router.patch("/", validate(updateSettingsSchema), settingsController.updateSettings);

module.exports = router;
