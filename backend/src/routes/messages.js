const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, validateBody } = require('../middleware');
const { schemas } = require('../utils/validators');

/**
 * @route   GET /api/messages/:bookingId
 * @desc    Get messages for a booking
 * @access  Private (Booking participant or Admin)
 */
router.get(
    '/:bookingId',
    authenticate,
    messageController.getMessages
);

/**
 * @route   POST /api/messages/:bookingId
 * @desc    Send a message in booking chat
 * @access  Private (Booking participant)
 * @note    Also available via Socket.IO
 */
router.post(
    '/:bookingId',
    authenticate,
    validateBody(schemas.sendMessage),
    messageController.sendMessage
);

/**
 * @route   PATCH /api/messages/:bookingId/read
 * @desc    Mark messages as read
 * @access  Private (Booking participant)
 */
router.patch(
    '/:bookingId/read',
    authenticate,
    messageController.markAsRead
);

module.exports = router;
