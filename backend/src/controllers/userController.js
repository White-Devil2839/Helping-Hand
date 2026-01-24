const { User } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');
const { ROLES } = require('../config/constants');

/**
 * Get current user profile
 * GET /api/users/me
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId)
        .populate('helperProfile.services', 'name category icon');

    res.status(200).json({
        success: true,
        user: user.toPublicJSON()
    });
});

/**
 * Update current user profile
 * PATCH /api/users/me
 */
const updateMe = asyncHandler(async (req, res) => {
    const { name, bio } = req.body;
    const updates = {};

    if (name) updates.name = name;

    // Bio is only for helpers
    if (bio !== undefined && req.user.role === ROLES.HELPER) {
        updates['helperProfile.bio'] = bio;
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true, runValidators: true }
    ).populate('helperProfile.services', 'name category icon');

    res.status(200).json({
        success: true,
        user: user.toPublicJSON()
    });
});

/**
 * List verified helpers
 * GET /api/users/helpers
 */
const listHelpers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, service, category } = req.query;

    const query = {
        role: ROLES.HELPER,
        'helperProfile.isVerified': true,
        isActive: true
    };

    // Filter by service if provided
    if (service) {
        query['helperProfile.services'] = service;
    }

    const helpers = await User.find(query)
        .select('name helperProfile.bio helperProfile.rating helperProfile.totalBookings helperProfile.services')
        .populate('helperProfile.services', 'name category icon')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ 'helperProfile.rating': -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        helpers,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Get helper profile
 * GET /api/users/helpers/:id
 */
const getHelper = asyncHandler(async (req, res) => {
    const helper = await User.findOne({
        _id: req.params.id,
        role: ROLES.HELPER,
        'helperProfile.isVerified': true,
        isActive: true
    })
        .select('name helperProfile')
        .populate('helperProfile.services', 'name category icon description');

    if (!helper) {
        throw new ApiError(404, 'Helper not found');
    }

    res.status(200).json({
        success: true,
        helper
    });
});

module.exports = {
    getMe,
    updateMe,
    listHelpers,
    getHelper
};
