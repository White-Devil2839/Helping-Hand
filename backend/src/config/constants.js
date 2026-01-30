/**
 * Booking State Machine Constants
 * 
 * States:
 * - REQUESTED: Customer created booking, awaiting helper
 * - ACCEPTED: Helper accepted, work not started
 * - IN_PROGRESS: Helper actively working
 * - COMPLETED: Helper marked work done, awaiting customer closure
 * - CLOSED: Customer confirmed, booking archived
 * 
 * Admin-only states:
 * - CANCELLED: Admin cancelled booking
 * - DISPUTED: Admin flagged for review
 * - FORCE_CLOSED: Admin forcibly closed
 */

const BOOKING_STATES = {
    REQUESTED: 'REQUESTED',
    ACCEPTED: 'ACCEPTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CLOSED: 'CLOSED',
    // Admin-only states
    CANCELLED: 'CANCELLED',
    DISPUTED: 'DISPUTED',
    FORCE_CLOSED: 'FORCE_CLOSED'
};

/**
 * Valid state transitions
 * Key: current state
 * Value: array of allowed next states
 */
const STATE_TRANSITIONS = {
    [BOOKING_STATES.REQUESTED]: [
        BOOKING_STATES.ACCEPTED,
        BOOKING_STATES.CANCELLED
    ],
    [BOOKING_STATES.ACCEPTED]: [
        BOOKING_STATES.IN_PROGRESS,
        BOOKING_STATES.CANCELLED,
        BOOKING_STATES.DISPUTED
    ],
    [BOOKING_STATES.IN_PROGRESS]: [
        BOOKING_STATES.COMPLETED,
        BOOKING_STATES.DISPUTED
    ],
    [BOOKING_STATES.COMPLETED]: [
        BOOKING_STATES.CLOSED,
        BOOKING_STATES.DISPUTED
    ],
    [BOOKING_STATES.CLOSED]: [], // Terminal
    [BOOKING_STATES.CANCELLED]: [], // Terminal
    [BOOKING_STATES.DISPUTED]: [
        BOOKING_STATES.FORCE_CLOSED
    ],
    [BOOKING_STATES.FORCE_CLOSED]: [] // Terminal
};

/**
 * States that only admins can transition to
 */
const ADMIN_ONLY_STATES = [
    BOOKING_STATES.CANCELLED,
    BOOKING_STATES.DISPUTED,
    BOOKING_STATES.FORCE_CLOSED
];

/**
 * Terminal states where no further transitions are allowed
 */
const TERMINAL_STATES = [
    BOOKING_STATES.CLOSED,
    BOOKING_STATES.CANCELLED,
    BOOKING_STATES.FORCE_CLOSED
];

/**
 * User roles
 */
const ROLES = {
    CUSTOMER: 'customer',
    HELPER: 'helper',
    ADMIN: 'admin'
};

/**
 * Service categories
 */
const SERVICE_CATEGORIES = [
    'home',
    'errands',
    'tech',
    'care',
    'other'
];

/**
 * Admin action types for audit log
 */
const ADMIN_ACTION_TYPES = [
    'USER_DEACTIVATE',
    'USER_ACTIVATE',
    'HELPER_VERIFY',
    'HELPER_UNVERIFY',
    'BOOKING_CANCEL',
    'BOOKING_DISPUTE',
    'BOOKING_FORCE_CLOSE',
    'SERVICE_CREATE',
    'SERVICE_UPDATE',
    'SERVICE_DEACTIVATE'
];

module.exports = {
    BOOKING_STATES,
    STATE_TRANSITIONS,
    ADMIN_ONLY_STATES,
    TERMINAL_STATES,
    ROLES,
    SERVICE_CATEGORIES,
    ADMIN_ACTION_TYPES
};
