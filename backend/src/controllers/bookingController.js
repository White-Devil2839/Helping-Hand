const { Booking, Service, User } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');
const { BOOKING_STATES, ROLES } = require('../config/constants');
const {
    emitBookingUpdate,
    emitNewBookingAvailable,
    emitBookingAccepted,
    emitSystemMessage
} = require('../socket/emitters');

/**
 * Create a new booking
 * POST /api/bookings
 */
const createBooking = asyncHandler(async (req, res) => {
    const { serviceId, description, location, scheduledAt, estimatedDuration } = req.body;

    // Verify service exists and is active
    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
        throw new ApiError(404, 'Service not found');
    }

    const booking = await Booking.create({
        customer: req.userId,
        service: serviceId,
        description,
        location,
        scheduledAt,
        estimatedDuration: estimatedDuration || 60
    });

    await booking.populate([
        { path: 'service', select: 'name category icon' },
        { path: 'customer', select: 'name phone' }
    ]);

    // Emit socket event for helpers
    emitNewBookingAvailable(booking, service);

    res.status(201).json({
        success: true,
        booking
    });
});

/**
 * List my bookings (as customer or helper)
 * GET /api/bookings
 */
const listMyBookings = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;

    // Build query based on role
    const query = req.user.role === ROLES.HELPER
        ? { helper: req.userId }
        : { customer: req.userId };

    if (status) {
        query.status = status;
    }

    const bookings = await Booking.find(query)
        .populate('service', 'name category icon')
        .populate('customer', 'name phone')
        .populate('helper', 'name phone helperProfile.rating')
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
 * List available bookings for helpers
 * GET /api/bookings/available
 */
const listAvailableBookings = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, service } = req.query;

    const query = {
        status: BOOKING_STATES.REQUESTED,
        scheduledAt: { $gte: new Date() }
    };

    // Filter by services the helper offers
    if (req.user.helperProfile?.services?.length > 0) {
        query.service = { $in: req.user.helperProfile.services };
    }

    // Additional filter by specific service
    if (service) {
        query.service = service;
    }

    const bookings = await Booking.find(query)
        .populate('service', 'name category icon')
        .populate('customer', 'name')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ scheduledAt: 1 });

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
 * Get booking details
 * GET /api/bookings/:id
 */
const getBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('service', 'name category icon description')
        .populate('customer', 'name phone')
        .populate('helper', 'name phone helperProfile.rating helperProfile.bio')
        .populate('statusHistory.changedBy', 'name role');

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    // Check access: participant or admin
    const isParticipant = booking.isParticipant(req.userId);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isParticipant && !isAdmin) {
        throw new ApiError(403, 'Access denied');
    }

    res.status(200).json({
        success: true,
        booking
    });
});

/**
 * Accept a booking
 * PATCH /api/bookings/:id/accept
 */
const acceptBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    // Validate state transition
    if (!booking.canTransitionTo(BOOKING_STATES.ACCEPTED, req.user.role)) {
        throw new ApiError(400, `Cannot accept booking in ${booking.status} state`);
    }

    // Perform transition
    booking.helper = req.userId;
    booking.transition(BOOKING_STATES.ACCEPTED, req.userId);
    await booking.save();

    await booking.populate([
        { path: 'service', select: 'name category icon' },
        { path: 'customer', select: 'name phone' },
        { path: 'helper', select: 'name phone' }
    ]);

    // Emit socket events
    emitBookingAccepted(booking);
    emitSystemMessage(booking._id, `${req.user.name} has accepted this booking`);

    res.status(200).json({
        success: true,
        booking
    });
});

/**
 * Start work on booking
 * PATCH /api/bookings/:id/start
 */
const startBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    // Verify caller is the assigned helper
    if (!booking.helper?.equals(req.userId)) {
        throw new ApiError(403, 'Only assigned helper can start booking');
    }

    // Validate state transition
    if (!booking.canTransitionTo(BOOKING_STATES.IN_PROGRESS, req.user.role)) {
        throw new ApiError(400, `Cannot start booking in ${booking.status} state`);
    }

    booking.transition(BOOKING_STATES.IN_PROGRESS, req.userId);
    await booking.save();

    await booking.populate([
        { path: 'service', select: 'name category icon' },
        { path: 'customer', select: 'name phone' },
        { path: 'helper', select: 'name phone' }
    ]);

    // Emit socket event
    emitBookingUpdate(booking);
    emitSystemMessage(booking._id, `${req.user.name} has started working on this booking`);

    res.status(200).json({
        success: true,
        booking
    });
});

/**
 * Mark booking as completed
 * PATCH /api/bookings/:id/complete
 */
const completeBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    // Verify caller is the assigned helper
    if (!booking.helper?.equals(req.userId)) {
        throw new ApiError(403, 'Only assigned helper can complete booking');
    }

    // Validate state transition
    if (!booking.canTransitionTo(BOOKING_STATES.COMPLETED, req.user.role)) {
        throw new ApiError(400, `Cannot complete booking in ${booking.status} state`);
    }

    booking.transition(BOOKING_STATES.COMPLETED, req.userId);
    await booking.save();

    // Update helper's total bookings
    await User.findByIdAndUpdate(booking.helper, {
        $inc: { 'helperProfile.totalBookings': 1 }
    });

    await booking.populate([
        { path: 'service', select: 'name category icon' },
        { path: 'customer', select: 'name phone' },
        { path: 'helper', select: 'name phone' }
    ]);

    // Emit socket event
    emitBookingUpdate(booking);
    emitSystemMessage(booking._id, `${req.user.name} has marked this booking as complete`);

    res.status(200).json({
        success: true,
        booking
    });
});

/**
 * Close booking (customer confirmation)
 * PATCH /api/bookings/:id/close
 */
const closeBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    // Verify caller is the customer
    if (!booking.customer.equals(req.userId)) {
        throw new ApiError(403, 'Only customer can close booking');
    }

    // Validate state transition
    if (!booking.canTransitionTo(BOOKING_STATES.CLOSED, req.user.role)) {
        throw new ApiError(400, `Cannot close booking in ${booking.status} state`);
    }

    booking.transition(BOOKING_STATES.CLOSED, req.userId);
    await booking.save();

    await booking.populate([
        { path: 'service', select: 'name category icon' },
        { path: 'customer', select: 'name phone' },
        { path: 'helper', select: 'name phone' }
    ]);

    res.status(200).json({
        success: true,
        booking
    });
});

/**
 * Rate a booking
 * POST /api/bookings/:id/rate
 */
const rateBooking = asyncHandler(async (req, res) => {
    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    // Verify caller is the customer
    if (!booking.customer.equals(req.userId)) {
        throw new ApiError(403, 'Only customer can rate booking');
    }

    // Check booking is completed or closed
    if (![BOOKING_STATES.COMPLETED, BOOKING_STATES.CLOSED].includes(booking.status)) {
        throw new ApiError(400, 'Can only rate completed bookings');
    }

    // Check not already rated
    if (booking.customerRating) {
        throw new ApiError(400, 'Booking already rated');
    }

    booking.customerRating = rating;
    if (review) booking.customerReview = review;
    await booking.save();

    // Update helper's average rating
    if (booking.helper) {
        const helperBookings = await Booking.find({
            helper: booking.helper,
            customerRating: { $exists: true }
        }).select('customerRating');

        const avgRating = helperBookings.reduce((sum, b) => sum + b.customerRating, 0) / helperBookings.length;

        await User.findByIdAndUpdate(booking.helper, {
            'helperProfile.rating': Math.round(avgRating * 10) / 10 // Round to 1 decimal
        });
    }

    res.status(200).json({
        success: true,
        booking
    });
});

module.exports = {
    createBooking,
    listMyBookings,
    listAvailableBookings,
    getBooking,
    acceptBooking,
    startBooking,
    completeBooking,
    closeBooking,
    rateBooking
};
