const serviceService = require("../../services/service.service");
const ApiResponse = require("../../utils/ApiResponse");


const listServices = async (req, res, next) => {
    try {
        const result = await serviceService.adminListServices(req.query);
        return new ApiResponse(200, "Services fetched", result.services, {
            ...result.meta,
            categories: result.categories,
        }).send(res);
    } catch (err) { next(err); }
};

const createService = async (req, res, next) => {
    try {
        const service = await serviceService.createService(req.body);
        return new ApiResponse(201, "Service created", service).send(res);
    } catch (err) { next(err); }
};

const updateService = async (req, res, next) => {
    try {
        const service = await serviceService.updateService(req.params.id, req.body);
        return new ApiResponse(200, "Service updated", service).send(res);
    } catch (err) { next(err); }
};

const deleteService = async (req, res, next) => {
    try {
        await serviceService.deleteService(req.params.id);
        return new ApiResponse(200, "Service deactivated").send(res);
    } catch (err) { next(err); }
};

module.exports = { listServices, createService, updateService, deleteService };
