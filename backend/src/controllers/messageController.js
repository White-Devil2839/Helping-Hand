const { Message, Booking } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');
const { TERMINAL_STATES, ROLES } = require('../config/constants');

/**
 * Get messages for a booking
 * GET /api/messages/:bookingId
 */
const getMessages = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    const isParticipant = booking.isParticipant(req.userId);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isParticipant && !isAdmin) {
        throw new ApiError(403, 'Access denied');
    }

    const messages = await Message.find({ booking: bookingId })
        .populate('sender', 'name role')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: 1 }); // Oldest first

    const total = await Message.countDocuments({ booking: bookingId });

    res.status(200).json({
        success: true,
        messages,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Send a message (REST fallback for socket)
 * POST /api/messages/:bookingId
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { content, messageType = 'text' } = req.body;

    // Verify booking exists and user is participant
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    if (!booking.isParticipant(req.userId)) {
        throw new ApiError(403, 'Only booking participants can send messages');
    }

    // Don't allow messages in terminal states
    if (TERMINAL_STATES.includes(booking.status)) {
        throw new ApiError(400, 'Cannot send messages to closed bookings');
    }

    const message = await Message.create({
        booking: bookingId,
        sender: req.userId,
        content,
        messageType
    });

    await message.populate('sender', 'name role');

    // TODO: Emit socket event for real-time delivery

    res.status(201).json({
        success: true,
        message
    });
});

/**
 * Mark messages as read
 * PATCH /api/messages/:bookingId/read
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { messageIds } = req.body;

    // Verify booking exists and user is participant
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ApiError(404, 'Booking not found');
    }

    if (!booking.isParticipant(req.userId)) {
        throw new ApiError(403, 'Access denied');
    }

    // Mark messages as read
    await Message.updateMany(
        {
            _id: { $in: messageIds },
            booking: bookingId,
            'readBy.user': { $ne: req.userId }
        },
        {
            $addToSet: {
                readBy: { user: req.userId, readAt: new Date() }
            }
        }
    );

    res.status(200).json({
        success: true,
        message: 'Messages marked as read'
    });
});

module.exports = {
    getMessages,
    sendMessage,
    markAsRead
};
