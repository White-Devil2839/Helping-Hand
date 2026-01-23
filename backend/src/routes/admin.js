const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const {
    authenticate,
    requireAdmin,
    validateBody,
    validateQuery
} = require('../middleware');
const { schemas } = require('../utils/validators');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ============== USER MANAGEMENT ==============

/**
 * @route   GET /api/admin/users
 * @desc    List all users
 * @access  Admin only
 */
router.get(
    '/users',
    validateQuery(schemas.pagination),
    adminController.listUsers
);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details
 * @access  Admin only
 */
router.get(
    '/users/:id',
    adminController.getUser
);

/**
 * @route   PATCH /api/admin/users/:id/deactivate
 * @desc    Deactivate a user
 * @access  Admin only
 */
router.patch(
    '/users/:id/deactivate',
    validateBody(schemas.adminOverride),
    adminController.deactivateUser
);

/**
 * @route   PATCH /api/admin/users/:id/activate
 * @desc    Reactivate a user
 * @access  Admin only
 */
router.patch(
    '/users/:id/activate',
    adminController.activateUser
);

// ============== HELPER VERIFICATION ==============

/**
 * @route   GET /api/admin/helpers/pending
 * @desc    List unverified helpers
 * @access  Admin only
 */
router.get(
    '/helpers/pending',
    adminController.listPendingHelpers
);

/**
 * @route   PATCH /api/admin/helpers/:id/verify
 * @desc    Verify a helper
 * @access  Admin only
 */
router.patch(
    '/helpers/:id/verify',
    validateBody(schemas.verifyHelper),
    adminController.verifyHelper
);

/**
 * @route   PATCH /api/admin/helpers/:id/unverify
 * @desc    Unverify a helper
 * @access  Admin only
 */
router.patch(
    '/helpers/:id/unverify',
    validateBody(schemas.adminOverride),
    adminController.unverifyHelper
);

// ============== BOOKING OVERSIGHT ==============

/**
 * @route   GET /api/admin/bookings
 * @desc    List all bookings
 * @access  Admin only
 */
router.get(
    '/bookings',
    validateQuery(schemas.pagination),
    adminController.listAllBookings
);

/**
 * @route   PATCH /api/admin/bookings/:id/cancel
 * @desc    Cancel a booking
 * @access  Admin only
 */
router.patch(
    '/bookings/:id/cancel',
    validateBody(schemas.adminOverride),
    adminController.cancelBooking
);

/**
 * @route   PATCH /api/admin/bookings/:id/dispute
 * @desc    Mark booking as disputed
 * @access  Admin only
 */
router.patch(
    '/bookings/:id/dispute',
    validateBody(schemas.adminOverride),
    adminController.disputeBooking
);

/**
 * @route   PATCH /api/admin/bookings/:id/force-close
 * @desc    Force close a booking
 * @access  Admin only
 */
router.patch(
    '/bookings/:id/force-close',
    validateBody(schemas.adminOverride),
    adminController.forceCloseBooking
);

// ============== SERVICE MANAGEMENT ==============

/**
 * @route   POST /api/admin/services
 * @desc    Create a new service
 * @access  Admin only
 */
router.post(
    '/services',
    validateBody(schemas.createService),
    adminController.createService
);

/**
 * @route   PATCH /api/admin/services/:id
 * @desc    Update a service
 * @access  Admin only
 */
router.patch(
    '/services/:id',
    validateBody(schemas.updateService),
    adminController.updateService
);

// ============== AUDIT LOG ==============

/**
 * @route   GET /api/admin/audit-log
 * @desc    View admin action history
 * @access  Admin only
 */
router.get(
    '/audit-log',
    validateQuery(schemas.pagination),
    adminController.getAuditLog
);

module.exports = router;
