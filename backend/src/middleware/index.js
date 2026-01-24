const { authenticate, optionalAuth } = require('./authenticate');
const {
    requireRole,
    requireAdmin,
    requireHelper,
    requireCustomer,
    requireVerifiedHelper,
    requireCustomerOrAdmin,
    requireHelperOrAdmin
} = require('./authorize');
const { validate, validateBody, validateQuery, validateParams } = require('./validate');
const { ApiError, notFound, errorHandler, asyncHandler } = require('./errorHandler');

module.exports = {
    // Authentication
    authenticate,
    optionalAuth,

    // Authorization
    requireRole,
    requireAdmin,
    requireHelper,
    requireCustomer,
    requireVerifiedHelper,
    requireCustomerOrAdmin,
    requireHelperOrAdmin,

    // Validation
    validate,
    validateBody,
    validateQuery,
    validateParams,

    // Error handling
    ApiError,
    notFound,
    errorHandler,
    asyncHandler
};
