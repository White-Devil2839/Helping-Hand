const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const {
    authenticate,
    requireCustomer,
    requireVerifiedHelper,
    validateBody
} = require('../middleware');
const { schemas } = require('../utils/validators');

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Customer only)
 */
router.post(
    '/',
    authenticate,
    requireCustomer,
    validateBody(schemas.createBooking),
    bookingController.createBooking
);

/**
 * @route   GET /api/bookings
 * @desc    List my bookings (customer or helper)
 * @access  Private
 */
router.get(
    '/',
    authenticate,
    bookingController.listMyBookings
);

/**
 * @route   GET /api/bookings/available
 * @desc    List available bookings for helpers to accept
 * @access  Private (Verified Helper only)
 */
router.get(
    '/available',
    authenticate,
    requireVerifiedHelper,
    bookingController.listAvailableBookings
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking details
 * @access  Private (Participant or Admin)
 */
router.get(
    '/:id',
    authenticate,
    bookingController.getBooking
);

/**
 * @route   PATCH /api/bookings/:id/accept
 * @desc    Accept a booking
 * @access  Private (Verified Helper only)
 */
router.patch(
    '/:id/accept',
    authenticate,
    requireVerifiedHelper,
    bookingController.acceptBooking
);

/**
 * @route   PATCH /api/bookings/:id/start
 * @desc    Start work on booking
 * @access  Private (Assigned Helper only)
 */
router.patch(
    '/:id/start',
    authenticate,
    bookingController.startBooking
);

/**
 * @route   PATCH /api/bookings/:id/complete
 * @desc    Mark booking as completed
 * @access  Private (Assigned Helper only)
 */
router.patch(
    '/:id/complete',
    authenticate,
    bookingController.completeBooking
);

/**
 * @route   PATCH /api/bookings/:id/close
 * @desc    Close booking (customer confirmation)
 * @access  Private (Customer only)
 */
router.patch(
    '/:id/close',
    authenticate,
    bookingController.closeBooking
);

/**
 * @route   POST /api/bookings/:id/rate
 * @desc    Rate a completed booking
 * @access  Private (Customer only)
 */
router.post(
    '/:id/rate',
    authenticate,
    validateBody(schemas.rateBooking),
    bookingController.rateBooking
);

module.exports = router;
