const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Generate JWT access token
 * @param {Object} user - User document
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
};

/**
 * Generate JWT refresh token
 * @param {Object} user - User document
 * @returns {string} JWT token
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            tokenType: 'refresh'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Generate token pair (access + refresh)
 * @param {Object} user - User document
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (user) => {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user)
    };
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyToken
};
