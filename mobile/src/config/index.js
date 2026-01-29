// API Configuration
// Use 'localhost' for iOS simulator
// Use your computer's IP (e.g., 10.2.90.203) for physical device
export const API_URL = 'http://localhost:5006/api';
export const SOCKET_URL = 'http://localhost:5006';

// App Configuration
export const APP_NAME = 'Helping Hand';

// Booking States
export const BOOKING_STATES = {
    REQUESTED: 'REQUESTED',
    ACCEPTED: 'ACCEPTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED',
    DISPUTED: 'DISPUTED',
    FORCE_CLOSED: 'FORCE_CLOSED'
};

// Terminal states (no further action possible)
export const TERMINAL_STATES = [
    BOOKING_STATES.CLOSED,
    BOOKING_STATES.CANCELLED,
    BOOKING_STATES.FORCE_CLOSED
];

// User Roles
export const ROLES = {
    CUSTOMER: 'customer',
    HELPER: 'helper',
    ADMIN: 'admin'
};

// Service Categories
export const SERVICE_CATEGORIES = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'errands', label: 'Errands', icon: 'cart' },
    { key: 'tech', label: 'Tech', icon: 'laptop' },
    { key: 'care', label: 'Care', icon: 'heart' },
    { key: 'other', label: 'Other', icon: 'help-circle' }
];

// Theme Colors
export const COLORS = {
    primary: '#4F46E5',
    primaryDark: '#4338CA',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB'
};
