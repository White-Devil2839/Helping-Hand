const { User, Service, Booking, AdminAction } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');
const { logAdminAction } = require('../utils/auditLogger');
const { BOOKING_STATES, ROLES } = require('../config/constants');

// ============== USER MANAGEMENT ==============

/**
 * List all users
 * GET /api/admin/users
 */
const listUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, status } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const users = await User.find(query)
        .select('-refreshToken')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Get user details
 * GET /api/admin/users/:id
 */
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-refreshToken')
        .populate('helperProfile.services', 'name category')
        .populate('helperProfile.verifiedBy', 'name');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
        success: true,
        user
    });
});

/**
 * Deactivate a user
 * PATCH /api/admin/users/:id/deactivate
 */
const deactivateUser = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (!user.isActive) {
        throw new ApiError(400, 'User is already deactivated');
    }

    // Prevent deactivating other admins
    if (user.role === ROLES.ADMIN) {
        throw new ApiError(403, 'Cannot deactivate admin users');
    }

    const previousState = { isActive: user.isActive };

    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = req.userId;
    await user.save();

    // Log admin action
    await logAdminAction({
        adminId: req.userId,
        actionType: 'USER_DEACTIVATE',
        targetType: 'User',
        targetId: user._id,
        previousState,
        newState: { isActive: false },
        reason,
        req
    });

    res.status(200).json({
        success: true,
        user: user.toPublicJSON()
    });
});

/**
 * Activate a user
 * PATCH /api/admin/users/:id/activate
 */
const activateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.isActive) {
        throw new ApiError(400, 'User is already active');
    }

    const previousState = { isActive: user.isActive };

    user.isActive = true;
    user.deactivatedAt = undefined;
    user.deactivatedBy = undefined;
    await user.save();

    await logAdminAction({
        adminId: req.userId,
        actionType: 'USER_ACTIVATE',
        targetType: 'User',
        targetId: user._id,
        previousState,
        newState: { isActive: true },
        req
    });

    res.status(200).json({
        success: true,
        user: user.toPublicJSON()
    });
});

// ============== HELPER VERIFICATION ==============

/**
 * List pending (unverified) helpers
 * GET /api/admin/helpers/pending
 */
const listPendingHelpers = asyncHandler(async (req, res) => {
    const helpers = await User.find({
        role: ROLES.HELPER,
        'helperProfile.isVerified': false,
        isActive: true
    })
        .select('name phone helperProfile.bio helperProfile.services createdAt')
        .populate('helperProfile.services', 'name category')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        helpers
    });
});

/**
 * Verify a helper
 * PATCH /api/admin/helpers/:id/verify
 */
const verifyHelper = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.role !== ROLES.HELPER) {
        throw new ApiError(400, 'User is not a helper');
    }

    if (user.helperProfile?.isVerified) {
        throw new ApiError(400, 'Helper is already verified');
    }

    const previousState = { isVerified: false };

    user.helperProfile = {
        ...user.helperProfile,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: req.userId
    };
    await user.save();

    await logAdminAction({
        adminId: req.userId,
        actionType: 'HELPER_VERIFY',
        targetType: 'User',
        targetId: user._id,
        previousState,
        newState: { isVerified: true },
        reason,
        req
    });

    res.status(200).json({
        success: true,
        user: user.toPublicJSON()
    });
});

/**
 * Unverify a helper
 * PATCH /api/admin/helpers/:id/unverify
 */
const unverifyHelper = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.role !== ROLES.HELPER) {
        throw new ApiError(400, 'User is not a helper');
    }

    if (!user.helperProfile?.isVerified) {
        throw new ApiError(400, 'Helper is not verified');
    }

    const previousState = { isVerified: true };

    user.helperProfile.isVerified = false;
    user.helperProfile.verifiedAt = undefined;
    user.helperProfile.verifiedBy = undefined;
    await user.save();

    await logAdminAction({
        adminId: req.userId,
        actionType: 'HELPER_UNVERIFY',
        targetType: 'User',
        targetId: user._id,
        previousState,
        newState: { isVerified: false },
        reason,
        req
    });

    res.status(200).json({
        success: true,
        user: user.toPublicJSON()
    });
});

// ============== BOOKING OVERSIGHT ==============

/**
 * List all bookings
 * GET /api/admin/bookings
 */
const listAllBookings = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const bookings = await Booking.find(query)
        .populate('service', 'name category')
        .populate('customer', 'name phone')
        .populate('helper', 'name phone')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    res.status(200).json({
        success: true,
        bookings,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Cancel a booking (admin override)
 * PATCH /api/admin/bookings/:id/cancel
 */
const cancelBooking = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    if (!booking.canTransitionTo(BOOKING_STATES.CANCELLED, ROLES.ADMIN)) {
        throw new ApiError(400, `Cannot cancel booking in ${booking.status} state`);
    }

    const previousState = { status: booking.status };

    booking.transition(BOOKING_STATES.CANCELLED, req.userId, reason);
    booking.adminNotes = reason;
    await booking.save();

    await logAdminAction({
        adminId: req.userId,
        actionType: 'BOOKING_CANCEL',
        targetType: 'Booking',
        targetId: booking._id,
        previousState,
        newState: { status: BOOKING_STATES.CANCELLED },
        reason,
        req
    });

    await booking.populate([
        { path: 'service', select: 'name' },
        { path: 'customer', select: 'name' },
        { path: 'helper', select: 'name' }
    ]);

    res.status(200).json({
        success: true,
        booking
    });
});

/**
 * Mark booking as disputed
 * PATCH /api/admin/bookings/:id/dispute
 */
const disputeBooking = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    if (!booking.canTransitionTo(BOOKING_STATES.DISPUTED, ROLES.ADMIN)) {
        throw new ApiError(400, `Cannot dispute booking in ${booking.status} state`);
    }

    const previousState = { status: booking.status };

    booking.transition(BOOKING_STATES.DISPUTED, req.userId, reason);
    booking.adminNotes = reason;
    await booking.save();

    await logAdminAction({
        adminId: req.userId,
        actionType: 'BOOKING_DISPUTE',
        targetType: 'Booking',
        targetId: booking._id,
        previousState,
        newState: { status: BOOKING_STATES.DISPUTED },
        reason,
        req
    });

    await booking.populate([
        { path: 'service', select: 'name' },
        { path: 'customer', select: 'name' },
        { path: 'helper', select: 'name' }
    ]);

    res.status(200).json({
        success: true,
        booking
    });
});

/**
 * Force close a booking
 * PATCH /api/admin/bookings/:id/force-close
 */
const forceCloseBooking = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    if (!booking.canTransitionTo(BOOKING_STATES.FORCE_CLOSED, ROLES.ADMIN)) {
        throw new ApiError(400, `Cannot force-close booking in ${booking.status} state`);
    }

    const previousState = { status: booking.status };

    booking.transition(BOOKING_STATES.FORCE_CLOSED, req.userId, reason);
    booking.adminNotes = reason;
    await booking.save();

    await logAdminAction({
        adminId: req.userId,
        actionType: 'BOOKING_FORCE_CLOSE',
        targetType: 'Booking',
        targetId: booking._id,
        previousState,
        newState: { status: BOOKING_STATES.FORCE_CLOSED },
        reason,
        req
    });

    await booking.populate([
        { path: 'service', select: 'name' },
        { path: 'customer', select: 'name' },
        { path: 'helper', select: 'name' }
    ]);

    res.status(200).json({
        success: true,
        booking
    });
});

// ============== SERVICE MANAGEMENT ==============

/**
 * Create a new service
 * POST /api/admin/services
 */
const createService = asyncHandler(async (req, res) => {
    const { name, description, category, icon } = req.body;

    const service = await Service.create({
        name,
        description,
        category,
        icon,
        createdBy: req.userId
    });

    await logAdminAction({
        adminId: req.userId,
        actionType: 'SERVICE_CREATE',
        targetType: 'Service',
        targetId: service._id,
        newState: { name, category },
        req
    });

    res.status(201).json({
        success: true,
        service
    });
});

/**
 * Update a service
 * PATCH /api/admin/services/:id
 */
const updateService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
        throw new ApiError(404, 'Service not found');
    }

    const previousState = {
        name: service.name,
        category: service.category,
        isActive: service.isActive
    };

    // Apply updates
    const allowedUpdates = ['name', 'description', 'category', 'icon', 'isActive'];
    allowedUpdates.forEach(key => {
        if (req.body[key] !== undefined) {
            service[key] = req.body[key];
        }
    });

    await service.save();

    const actionType = req.body.isActive === false ? 'SERVICE_DEACTIVATE' : 'SERVICE_UPDATE';

    await logAdminAction({
        adminId: req.userId,
        actionType,
        targetType: 'Service',
        targetId: service._id,
        previousState,
        newState: {
            name: service.name,
            category: service.category,
            isActive: service.isActive
        },
        req
    });

    res.status(200).json({
        success: true,
        service
    });
});

// ============== AUDIT LOG ==============

/**
 * Get audit log
 * GET /api/admin/audit-log
 */
const getAuditLog = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, actionType, adminId, targetType } = req.query;

    const query = {};
    if (actionType) query.actionType = actionType;
    if (adminId) query.admin = adminId;
    if (targetType) query.targetType = targetType;

    const actions = await AdminAction.find(query)
        .populate('admin', 'name')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await AdminAction.countDocuments(query);

    res.status(200).json({
        success: true,
        actions,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

module.exports = {
    // User management
    listUsers,
    getUser,
    deactivateUser,
    activateUser,
    // Helper verification
    listPendingHelpers,
    verifyHelper,
    unverifyHelper,
    // Booking oversight
    listAllBookings,
    cancelBooking,
    disputeBooking,
    forceCloseBooking,
    // Service management
    createService,
    updateService,
    // Audit log
    getAuditLog
};
