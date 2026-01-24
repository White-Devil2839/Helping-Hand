const { ROLES } = require('../config/constants');

/**
 * Role-based authorization middleware factory
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Require admin role
 */
const requireAdmin = requireRole(ROLES.ADMIN);

/**
 * Require helper role
 */
const requireHelper = requireRole(ROLES.HELPER);

/**
 * Require customer role
 */
const requireCustomer = requireRole(ROLES.CUSTOMER);

/**
 * Require verified helper
 * Must be used after authenticate middleware
 */
const requireVerifiedHelper = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }

    if (req.user.role !== ROLES.HELPER) {
        return res.status(403).json({
            success: false,
            error: 'Must be a helper'
        });
    }

    if (!req.user.helperProfile?.isVerified) {
        return res.status(403).json({
            success: false,
            error: 'Helper account not verified'
        });
    }

    next();
};

/**
 * Require customer or admin (for viewing customer-owned resources)
 */
const requireCustomerOrAdmin = requireRole(ROLES.CUSTOMER, ROLES.ADMIN);

/**
 * Require helper or admin (for viewing helper-owned resources)
 */
const requireHelperOrAdmin = requireRole(ROLES.HELPER, ROLES.ADMIN);

module.exports = {
    requireRole,
    requireAdmin,
    requireHelper,
    requireCustomer,
    requireVerifiedHelper,
    requireCustomerOrAdmin,
    requireHelperOrAdmin
};
