const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "hair-salon",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = upload;
