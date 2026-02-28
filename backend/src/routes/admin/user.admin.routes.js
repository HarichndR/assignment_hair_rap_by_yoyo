const express = require("express");
const userAdminController = require("../../controllers/admin/user.admin.controller");

const router = express.Router();

router.get("/", userAdminController.getAllUsers);

module.exports = router;
