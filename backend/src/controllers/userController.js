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

module.exports = {
    getMe,
    updateMe
};
