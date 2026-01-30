const { AdminAction } = require('../models');

/**
 * Log an admin action to the audit trail
 * 
 * @param {Object} params
 * @param {ObjectId} params.adminId - Admin user ID
 * @param {string} params.actionType - Type of action (from ADMIN_ACTION_TYPES)
 * @param {string} params.targetType - 'User' | 'Booking' | 'Service'
 * @param {ObjectId} params.targetId - ID of target document
 * @param {Object} params.previousState - State before change
 * @param {Object} params.newState - State after change
 * @param {string} params.reason - Optional reason for action
 * @param {Object} params.req - Express request (for IP/UA extraction)
 * @returns {Promise<AdminAction>}
 */
const logAdminAction = async ({
    adminId,
    actionType,
    targetType,
    targetId,
    previousState = null,
    newState = null,
    reason = null,
    req = null
}) => {
    const action = await AdminAction.create({
        admin: adminId,
        actionType,
        targetType,
        targetId,
        previousState,
        newState,
        reason,
        ipAddress: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.get('User-Agent') || null
    });

    return action;
};

module.exports = {
    logAdminAction
};
