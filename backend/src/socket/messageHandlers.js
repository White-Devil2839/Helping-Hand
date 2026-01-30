const { Message, Booking } = require('../models');
const { TERMINAL_STATES, ROLES } = require('../config/constants');

/**
 * Register message-related socket handlers
 * @param {Server} io - Socket.IO server instance
 * @param {Socket} socket - Connected socket
 */
const registerMessageHandlers = (io, socket) => {

    /**
     * Send a message in a booking chat
     * Event: message:send
     * Payload: { bookingId: string, content: string, messageType?: string }
     */
    socket.on('message:send', async ({ bookingId, content, messageType = 'text' }) => {
        try {
            // Validate input
            if (!bookingId || !content) {
                return socket.emit('error', { message: 'Booking ID and content required' });
            }

            if (content.length > 2000) {
                return socket.emit('error', { message: 'Message too long (max 2000 characters)' });
            }

            // Verify user is in the booking room
            const roomName = `booking:${bookingId}`;
            if (!socket.rooms.has(roomName)) {
                return socket.emit('error', { message: 'Join the booking room first' });
            }

            // Verify booking exists and is not closed
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return socket.emit('error', { message: 'Booking not found' });
            }

            if (TERMINAL_STATES.includes(booking.status)) {
                return socket.emit('error', { message: 'Cannot message in closed booking' });
            }

            // Verify user is a participant (not just admin viewing)
            const isParticipant =
                booking.customer.toString() === socket.userId ||
                booking.helper?.toString() === socket.userId;

            if (!isParticipant) {
                return socket.emit('error', { message: 'Only participants can send messages' });
            }

            // Persist message
            const message = await Message.create({
                booking: bookingId,
                sender: socket.userId,
                content,
                messageType
            });

            // Prepare response payload
            const messagePayload = {
                _id: message._id,
                booking: bookingId,
                sender: {
                    _id: socket.userId,
                    name: socket.user.name,
                    role: socket.userRole
                },
                content,
                messageType,
                createdAt: message.createdAt
            };

            // Broadcast to room (including sender for confirmation)
            io.to(roomName).emit('message:new', messagePayload);

            // Send notification to offline recipient via their personal room
            const recipientId = booking.customer.toString() === socket.userId
                ? booking.helper?.toString()
                : booking.customer.toString();

            if (recipientId && recipientId !== socket.userId) {
                io.to(`user:${recipientId}`).emit('notification:new-message', {
                    bookingId,
                    senderName: socket.user.name,
                    preview: content.substring(0, 100),
                    createdAt: message.createdAt
                });
            }

            console.log(`[Socket] Message sent in ${roomName} by ${socket.user.name}`);

        } catch (err) {
            console.error('[Socket] message:send error:', err);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    /**
     * Mark messages as read
     * Event: message:read
     * Payload: { bookingId: string, messageIds: string[] }
     */
    socket.on('message:read', async ({ bookingId, messageIds }) => {
        try {
            if (!bookingId || !messageIds?.length) {
                return socket.emit('error', { message: 'Booking ID and message IDs required' });
            }

            // Update read receipts
            await Message.updateMany(
                {
                    _id: { $in: messageIds },
                    booking: bookingId,
                    'readBy.user': { $ne: socket.userId }
                },
                {
                    $addToSet: {
                        readBy: { user: socket.userId, readAt: new Date() }
                    }
                }
            );

            // Notify other users in room about read receipt
            socket.to(`booking:${bookingId}`).emit('message:read-receipt', {
                bookingId,
                messageIds,
                readBy: {
                    userId: socket.userId,
                    userName: socket.user.name
                },
                readAt: new Date()
            });

        } catch (err) {
            console.error('[Socket] message:read error:', err);
            socket.emit('error', { message: 'Failed to mark as read' });
        }
    });

    /**
     * Get unread message count for a booking
     * Event: message:unread-count
     * Payload: { bookingId: string }
     */
    socket.on('message:unread-count', async ({ bookingId }) => {
        try {
            if (!bookingId) {
                return socket.emit('error', { message: 'Booking ID required' });
            }

            const count = await Message.countDocuments({
                booking: bookingId,
                sender: { $ne: socket.userId },
                'readBy.user': { $ne: socket.userId }
            });

            socket.emit('message:unread-count', { bookingId, count });

        } catch (err) {
            console.error('[Socket] message:unread-count error:', err);
            socket.emit('error', { message: 'Failed to get unread count' });
        }
    });
};

module.exports = registerMessageHandlers;
