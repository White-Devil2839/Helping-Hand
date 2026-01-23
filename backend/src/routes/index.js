const authRoutes = require('./auth');
const userRoutes = require('./users');
const serviceRoutes = require('./services');
const bookingRoutes = require('./bookings');
const messageRoutes = require('./messages');
const adminRoutes = require('./admin');

module.exports = {
    authRoutes,
    userRoutes,
    serviceRoutes,
    bookingRoutes,
    messageRoutes,
    adminRoutes
};
