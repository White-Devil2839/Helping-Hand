/**
 * Validation middleware factory
 * Creates middleware that validates request body/query/params against Joi schema
 * 
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            // Return the first specific error message for better UX
            const firstError = errors[0]?.message || 'Validation failed';

            return res.status(400).json({
                success: false,
                error: firstError,
                details: errors
            });
        }

        // Replace request property with validated/sanitized value
        req[property] = value;
        next();
    };
};

/**
 * Validate request body
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate route parameters
 */
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
    validate,
    validateBody,
    validateQuery,
    validateParams
};
