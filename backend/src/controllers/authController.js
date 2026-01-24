const { User } = require('../models');
const { generateTokenPair, verifyToken } = require('../utils/jwt');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * Request OTP (mocked)
 * POST /api/auth/request-otp
 */
const requestOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    // In production: send real OTP via Twilio/Firebase
    // For portfolio: always succeed with mocked OTP
    console.log(`[MOCKED OTP] Sending OTP to ${phone}: ${process.env.OTP_MOCK_CODE || '123456'}`);

    res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: parseInt(process.env.OTP_EXPIRY_SECONDS) || 300,
        // Include mock code in development for testing
        ...(process.env.NODE_ENV === 'development' && {
            mockOtp: process.env.OTP_MOCK_CODE || '123456'
        })
    });
});

/**
 * Verify OTP and get tokens
 * POST /api/auth/verify-otp
 */
const verifyOtp = asyncHandler(async (req, res) => {
    const { phone, otp, name } = req.body;

    // Verify OTP (mocked - always accept the mock code)
    const validOtp = process.env.OTP_MOCK_CODE || '123456';
    if (otp !== validOtp) {
        throw new ApiError(401, 'Invalid OTP');
    }

    // Find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
        // New user - if no name provided, tell client to collect it
        if (!name) {
            return res.status(200).json({
                success: true,
                isNewUser: true,
                message: 'New user, please provide name'
            });
        }

        user = await User.create({
            phone,
            name,
            role: 'customer' // Default role
        });
        isNewUser = true;
    }

    // Check if user is active
    if (!user.isActive) {
        throw new ApiError(403, 'Account has been deactivated');
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Save refresh token (hashed in production)
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
        success: true,
        isNewUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: user.toPublicJSON()
    });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: token } = req.body;

    // Verify refresh token
    const decoded = verifyToken(token);
    if (!decoded || decoded.tokenType !== 'refresh') {
        throw new ApiError(401, 'Invalid refresh token');
    }

    // Find user and verify stored token matches
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
        throw new ApiError(401, 'Invalid refresh token');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Account has been deactivated');
    }

    // Generate new tokens
    const tokens = generateTokenPair(user);

    // Update stored refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    });
});

module.exports = {
    requestOtp,
    verifyOtp,
    refreshToken
};
