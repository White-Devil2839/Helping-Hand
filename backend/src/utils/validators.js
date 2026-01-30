const Joi = require('joi');
const mongoose = require('mongoose');

/**
 * Custom Joi extension for MongoDB ObjectId validation
 */
const objectId = Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
}, 'MongoDB ObjectId validation');

/**
 * Phone number validation
 */
const phone = Joi.string()
    .pattern(/^\+?[1-9]\d{9,14}$/)
    .message('Invalid phone number format');

/**
 * Common validation schemas
 */
const schemas = {
    // Auth
    requestOtp: Joi.object({
        phone: phone.required()
    }),

    verifyOtp: Joi.object({
        phone: phone.required(),
        otp: Joi.string().length(6).required(),
        name: Joi.string().trim().max(100).when('$isNewUser', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
    }),

    refreshToken: Joi.object({
        refreshToken: Joi.string().required()
    }),

    // User
    updateProfile: Joi.object({
        name: Joi.string().trim().max(100),
        bio: Joi.string().max(500)
    }).min(1),

    // Service
    createService: Joi.object({
        name: Joi.string().trim().max(100).required(),
        description: Joi.string().max(1000),
        category: Joi.string().valid('home', 'errands', 'tech', 'care', 'other').required(),
        icon: Joi.string()
    }),

    updateService: Joi.object({
        name: Joi.string().trim().max(100),
        description: Joi.string().max(1000),
        category: Joi.string().valid('home', 'errands', 'tech', 'care', 'other'),
        icon: Joi.string(),
        isActive: Joi.boolean()
    }).min(1),

    // Booking
    createBooking: Joi.object({
        serviceId: objectId.required().messages({
            'any.required': 'Please select a service',
            'any.invalid': 'Invalid service selected'
        }),
        description: Joi.string().min(10).max(2000).required().messages({
            'any.required': 'Please describe what you need help with',
            'string.min': 'Description must be at least 10 characters',
            'string.max': 'Description cannot exceed 2000 characters'
        }),
        location: Joi.object({
            address: Joi.string().min(5).required().messages({
                'any.required': 'Please enter your address',
                'string.min': 'Please enter a complete address'
            }),
            coordinates: Joi.object({
                lat: Joi.number().min(-90).max(90),
                lng: Joi.number().min(-180).max(180)
            })
        }).required().messages({
            'any.required': 'Location is required'
        }),
        scheduledAt: Joi.date().greater('now').required().messages({
            'any.required': 'Please select when you need help',
            'date.greater': 'Please select a date and time in the future'
        }),
        estimatedDuration: Joi.number().min(15).max(480).messages({
            'number.min': 'Duration must be at least 15 minutes',
            'number.max': 'Duration cannot exceed 8 hours'
        })
    }),

    rateBooking: Joi.object({
        rating: Joi.number().min(1).max(5).required(),
        review: Joi.string().max(500)
    }),

    // Admin
    adminOverride: Joi.object({
        reason: Joi.string().max(1000).required()
    }),

    verifyHelper: Joi.object({
        reason: Joi.string().max(1000)
    }),

    // Pagination
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    }),

    // Message
    sendMessage: Joi.object({
        content: Joi.string().max(2000).required(),
        messageType: Joi.string().valid('text', 'image').default('text')
    })
};

module.exports = {
    objectId,
    phone,
    schemas
};
