const express = require("express");
const serviceController = require("../../controllers/admin/service.admin.controller");
const validate = require("../../middlewares/validate");
const { createServiceSchema, updateServiceSchema } = require("../../validations/service.validation");

const router = express.Router();

router.get("/", serviceController.listServices);         // GET with full filters
router.post("/", validate(createServiceSchema), serviceController.createService);
router.put("/:id", validate(updateServiceSchema), serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

module.exports = router;
