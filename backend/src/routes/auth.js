const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateBody } = require('../middleware');
const { schemas } = require('../utils/validators');

/**
 * @route   POST /api/auth/request-otp
 * @desc    Request OTP for phone verification (mocked)
 * @access  Public
 */
router.post(
    '/request-otp',
    validateBody(schemas.requestOtp),
    authController.requestOtp
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and get tokens
 * @access  Public
 */
router.post(
    '/verify-otp',
    validateBody(schemas.verifyOtp),
    authController.verifyOtp
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh',
    validateBody(schemas.refreshToken),
    authController.refreshToken
);

module.exports = router;
