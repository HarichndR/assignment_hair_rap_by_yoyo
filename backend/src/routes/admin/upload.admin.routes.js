const express = require("express");
const router = express.Router();
const uploadController = require("../../controllers/admin/upload.admin.controller");
const upload = require("../../middlewares/upload");



router.post(
    "/services/:id",
    upload.array("images", 3),
    uploadController.uploadServiceImages
);


router.post(
    "/staff/:id",
    upload.array("images", 3),
    uploadController.uploadStaffImages
);


router.post(
    "/users/:id",
    upload.array("image", 1),
    uploadController.uploadUserImages
);

module.exports = router;
