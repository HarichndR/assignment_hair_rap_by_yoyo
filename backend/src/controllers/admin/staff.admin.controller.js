const staffService = require("../../services/staff.service");
const ApiResponse = require("../../utils/ApiResponse");

const getAllStaff = async (req, res, next) => {
    try {
        const result = await staffService.listStaff(req.query);
        return new ApiResponse(200, "Staff fetched", result.staff, result.meta).send(res);
    } catch (err) { next(err); }
};

const createStaffMember = async (req, res, next) => {
    try {
        const staff = await staffService.createStaffMember(req.body);
        return new ApiResponse(201, "Staff created", staff).send(res);
    } catch (err) { next(err); }
};

const updateStaffMember = async (req, res, next) => {
    try {
        const staff = await staffService.updateStaffMember(req.params.id, req.body);
        return new ApiResponse(200, "Staff updated", staff).send(res);
    } catch (err) { next(err); }
};

const deactivateStaffMember = async (req, res, next) => {
    try {
        await staffService.deactivateStaffMember(req.params.id);
        return new ApiResponse(200, "Staff deactivated").send(res);
    } catch (err) { next(err); }
};

module.exports = { getAllStaff, createStaffMember, updateStaffMember, deactivateStaffMember };
