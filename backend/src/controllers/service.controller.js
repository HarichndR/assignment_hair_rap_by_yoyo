const serviceService = require("../services/service.service");
const slotService = require("../services/slot.service");
const ApiResponse = require("../utils/ApiResponse");

const listServices = async (req, res, next) => {
    try {
        const result = await serviceService.listServices(req.query);
        return new ApiResponse(200, "Services fetched", result.services, result.meta).send(res);
    } catch (err) { next(err); }
};

const getServiceAvailability = async (req, res, next) => {
    try {
        const slots = await slotService.listSlotsForService(req.params.id, req.query.date);
        return new ApiResponse(200, "Available slots", slots).send(res);
    } catch (err) { next(err); }
};

module.exports = { listServices, getServiceAvailability };
