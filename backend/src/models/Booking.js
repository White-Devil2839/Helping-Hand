const mongoose = require('mongoose');
const {
    BOOKING_STATES,
    STATE_TRANSITIONS,
    ADMIN_ONLY_STATES,
    TERMINAL_STATES,
    ROLES
} = require('../config/constants');

const bookingSchema = new mongoose.Schema({
    // Participants
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer is required']
    },
    helper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Service details
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: [true, 'Service is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    // Location
    location: {
        address: {
            type: String,
            required: [true, 'Address is required']
        },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },

    // Scheduling
    scheduledAt: {
        type: Date,
        required: [true, 'Scheduled date/time is required']
    },
    estimatedDuration: {
        type: Number, // minutes
        default: 60,
        min: [15, 'Duration must be at least 15 minutes'],
        max: [480, 'Duration cannot exceed 8 hours']
    },

    // State machine
    status: {
        type: String,
        enum: Object.values(BOOKING_STATES),
        default: BOOKING_STATES.REQUESTED
    },

    // State history for audit trail
    statusHistory: [{
        status: {
            type: String,
            enum: Object.values(BOOKING_STATES)
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String
    }],

    // Completion
    completedAt: Date,
    customerRating: {
        type: Number,
        min: 1,
        max: 5
    },
    customerReview: {
        type: String,
        maxlength: [500, 'Review cannot exceed 500 characters']
    },

    // Admin notes
    adminNotes: String
}, {
    timestamps: true
});

// Indexes
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ helper: 1, status: 1 });
bookingSchema.index({ status: 1, scheduledAt: 1 });
bookingSchema.index({ createdAt: -1 });

/**
 * Check if transition to new state is valid
 * @param {string} newStatus - Target state
 * @param {string} userRole - Role of user attempting transition
 * @returns {boolean}
 */
bookingSchema.methods.canTransitionTo = function (newStatus, userRole) {
    const allowedTransitions = STATE_TRANSITIONS[this.status] || [];

    // Check if new state is in allowed transitions
    if (!allowedTransitions.includes(newStatus)) {
        return false;
    }

    // Check admin-only states
    if (ADMIN_ONLY_STATES.includes(newStatus) && userRole !== ROLES.ADMIN) {
        return false;
    }

    return true;
};

/**
 * Perform state transition
 * @param {string} newStatus - Target state
 * @param {ObjectId} userId - User performing transition
 * @param {string} reason - Optional reason for transition
 */
bookingSchema.methods.transition = function (newStatus, userId, reason = null) {
    this.statusHistory.push({
        status: newStatus,
        changedBy: userId,
        changedAt: new Date(),
        reason
    });

    this.status = newStatus;

    // Set completion timestamp
    if (newStatus === BOOKING_STATES.COMPLETED) {
        this.completedAt = new Date();
    }
};

/**
 * Check if booking is in a terminal state
 * @returns {boolean}
 */
bookingSchema.methods.isTerminal = function () {
    return TERMINAL_STATES.includes(this.status);
};

/**
 * Check if user is a participant (customer or helper)
 * @param {ObjectId} userId
 * @returns {boolean}
 */
bookingSchema.methods.isParticipant = function (userId) {
    return (
        this.customer.equals(userId) ||
        (this.helper && this.helper.equals(userId))
    );
};

// Pre-save hook to record initial state
bookingSchema.pre('save', function (next) {
    if (this.isNew && this.statusHistory.length === 0) {
        this.statusHistory.push({
            status: BOOKING_STATES.REQUESTED,
            changedAt: new Date(),
            changedBy: this.customer
        });
    }
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
