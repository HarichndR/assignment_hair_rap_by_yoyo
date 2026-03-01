const Service = require("../../models/service.model");
const Staff = require("../../models/staff.model");
const User = require("../../models/user.model");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

const uploadGallery = (Model, modelName) => async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await Model.findById(id);

        if (!item) throw new ApiError(404, `${modelName} not found`);
        if (!req.files || req.files.length === 0) throw new ApiError(400, "No files uploaded");

        const newImages = req.files.map((file) => ({
            url: file.path,
            public_id: file.filename,
        }));


        item.images = [...(item.images || []), ...newImages].slice(0, 3);
        await item.save();

        return new ApiResponse(200, "Gallery updated successfully", item).send(res);
    } catch (err) { next(err); }
};

const uploadSingleImage = (Model, modelName) => async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await Model.findById(id);

        if (!item) throw new ApiError(404, `${modelName} not found`);
        if (!req.files || req.files.length === 0) throw new ApiError(400, "No file uploaded");


        const file = req.files[0];
        item.image = {
            url: file.path,
            public_id: file.filename,
        };
        await item.save();

        return new ApiResponse(200, "Profile image updated successfully", item).send(res);
    } catch (err) { next(err); }
};

module.exports = {
    uploadServiceImages: uploadGallery(Service, "Service"),
    uploadStaffImages: uploadGallery(Staff, "Staff"),
    uploadUserImages: uploadSingleImage(User, "User"),
};
