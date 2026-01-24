const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Check if refresh token was accidentally used
        if (decoded.tokenType === 'refresh') {
            return res.status(401).json({
                success: false,
                error: 'Access token required, refresh token provided'
            });
        }

        // Fetch user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account has been deactivated'
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication
 * Same as authenticate but doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    return authenticate(req, res, next);
};

module.exports = {
    authenticate,
    optionalAuth
};
