const { Booking } = require('../models');
const { TERMINAL_STATES, ROLES } = require('../config/constants');

/**
 * Register booking-related socket handlers
 * @param {Server} io - Socket.IO server instance
 * @param {Socket} socket - Connected socket
 */
const registerBookingHandlers = (io, socket) => {

    /**
     * Join a booking chat room
     * Event: booking:join
     * Payload: { bookingId: string }
     */
    socket.on('booking:join', async ({ bookingId }) => {
        try {
            if (!bookingId) {
                return socket.emit('error', { message: 'Booking ID required' });
            }

            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return socket.emit('error', { message: 'Booking not found' });
            }

            // Access control: only participants or admin
            const isCustomer = booking.customer.toString() === socket.userId;
            const isHelper = booking.helper?.toString() === socket.userId;
            const isAdmin = socket.userRole === ROLES.ADMIN;

            if (!isCustomer && !isHelper && !isAdmin) {
                return socket.emit('error', { message: 'Access denied' });
            }

            // Don't allow non-admins to join closed booking rooms
            if (TERMINAL_STATES.includes(booking.status) && !isAdmin) {
                return socket.emit('error', { message: 'Booking is closed' });
            }

            // Join the booking room
            const roomName = `booking:${bookingId}`;
            socket.join(roomName);

            // Confirm join
            socket.emit('booking:joined', {
                bookingId,
                status: booking.status
            });

            // Notify others in the room
            socket.to(roomName).emit('booking:user-joined', {
                bookingId,
                userId: socket.userId,
                userName: socket.user.name,
                userRole: socket.userRole
            });

            console.log(`[Socket] ${socket.user.name} joined room ${roomName}`);

        } catch (err) {
            console.error('[Socket] booking:join error:', err);
            socket.emit('error', { message: 'Failed to join booking room' });
        }
    });

    /**
     * Leave a booking chat room
     * Event: booking:leave
     * Payload: { bookingId: string }
     */
    socket.on('booking:leave', ({ bookingId }) => {
        if (!bookingId) return;

        const roomName = `booking:${bookingId}`;
        socket.leave(roomName);

        // Notify others
        socket.to(roomName).emit('booking:user-left', {
            bookingId,
            userId: socket.userId,
            userName: socket.user.name
        });

        console.log(`[Socket] ${socket.user.name} left room ${roomName}`);
    });

    /**
     * Get list of users currently in a booking room
     * Event: booking:get-users
     * Payload: { bookingId: string }
     */
    socket.on('booking:get-users', async ({ bookingId }) => {
        try {
            const roomName = `booking:${bookingId}`;
            const room = io.sockets.adapter.rooms.get(roomName);

            if (!room) {
                return socket.emit('booking:users', { bookingId, users: [] });
            }

            const users = [];
            for (const socketId of room) {
                const s = io.sockets.sockets.get(socketId);
                if (s && s.user) {
                    users.push({
                        oderId: s.userId,
                        name: s.user.name,
                        role: s.userRole
                    });
                }
            }

            socket.emit('booking:users', { bookingId, users });

        } catch (err) {
            console.error('[Socket] booking:get-users error:', err);
            socket.emit('error', { message: 'Failed to get room users' });
        }
    });

    /**
     * Typing indicator
     * Event: booking:typing
     * Payload: { bookingId: string, isTyping: boolean }
     */
    socket.on('booking:typing', ({ bookingId, isTyping }) => {
        if (!bookingId) return;

        socket.to(`booking:${bookingId}`).emit('booking:user-typing', {
            bookingId,
            userId: socket.userId,
            userName: socket.user.name,
            isTyping
        });
    });
};

module.exports = registerBookingHandlers;
