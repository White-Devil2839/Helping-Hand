const { getIO } = require('./index');

/**
 * Emit booking status update to participants
 * @param {Booking} booking - The booking document (with customer and helper)
 */
const emitBookingUpdate = (booking) => {
    const io = getIO();
    if (!io) return;

    const payload = {
        bookingId: booking._id,
        status: booking.status,
        updatedAt: new Date()
    };

    // Notify customer
    if (booking.customer) {
        const customerId = booking.customer._id?.toString() || booking.customer.toString();
        io.to(`user:${customerId}`).emit('booking:updated', payload);
    }

    // Notify helper
    if (booking.helper) {
        const helperId = booking.helper._id?.toString() || booking.helper.toString();
        io.to(`user:${helperId}`).emit('booking:updated', payload);
    }

    // Also emit to booking room for anyone watching
    io.to(`booking:${booking._id}`).emit('booking:status-changed', {
        bookingId: booking._id,
        status: booking.status,
        changedAt: new Date()
    });
};

/**
 * Emit new booking available for helpers
 * @param {Booking} booking - The new booking document
 * @param {Service} service - The service document
 */
const emitNewBookingAvailable = (booking, service) => {
    const io = getIO();
    if (!io) return;

    // Broadcast to all connected helpers
    // In production: filter by helper's services and location
    io.emit('booking:new-available', {
        bookingId: booking._id,
        service: {
            _id: service._id,
            name: service.name,
            category: service.category
        },
        location: booking.location.address,
        scheduledAt: booking.scheduledAt,
        createdAt: booking.createdAt
    });
};

/**
 * Emit booking accepted notification to customer
 * @param {Booking} booking - The booking (populated with helper)
 */
const emitBookingAccepted = (booking) => {
    const io = getIO();
    if (!io) return;

    const customerId = booking.customer._id?.toString() || booking.customer.toString();

    io.to(`user:${customerId}`).emit('booking:accepted', {
        bookingId: booking._id,
        helper: {
            _id: booking.helper._id,
            name: booking.helper.name
        },
        status: booking.status
    });

    // Also update booking room
    emitBookingUpdate(booking);
};

/**
 * Emit system message to booking room
 * @param {string} bookingId
 * @param {string} content
 */
const emitSystemMessage = async (bookingId, content) => {
    const io = getIO();
    if (!io) return;

    const { Message } = require('../models');

    // Persist system message
    const message = await Message.create({
        booking: bookingId,
        sender: null, // System messages have no sender
        content,
        messageType: 'system'
    });

    io.to(`booking:${bookingId}`).emit('message:new', {
        _id: message._id,
        booking: bookingId,
        sender: null,
        content,
        messageType: 'system',
        createdAt: message.createdAt
    });
};

module.exports = {
    emitBookingUpdate,
    emitNewBookingAvailable,
    emitBookingAccepted,
    emitSystemMessage
};
