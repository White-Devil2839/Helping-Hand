const { Service } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * List active services
 * GET /api/services
 */
const listServices = asyncHandler(async (req, res) => {
    const { category } = req.query;

    const query = { isActive: true };
    if (category) {
        query.category = category;
    }

    const services = await Service.find(query)
        .select('name description category icon')
        .sort({ category: 1, name: 1 });

    res.status(200).json({
        success: true,
        services
    });
});

/**
 * Get service details
 * GET /api/services/:id
 */
const getService = asyncHandler(async (req, res) => {
    const service = await Service.findOne({
        _id: req.params.id,
        isActive: true
    });

    if (!service) {
        throw new ApiError(404, 'Service not found');
    }

    res.status(200).json({
        success: true,
        service
    });
});

module.exports = {
    listServices,
    getService
};
