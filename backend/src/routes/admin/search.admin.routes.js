const express = require("express");
const searchController = require("../../controllers/admin/search.admin.controller");

const router = express.Router();


router.get("/", searchController.globalSearch);

module.exports = router;
