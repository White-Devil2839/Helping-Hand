const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const registerBookingHandlers = require('./bookingHandlers');
const registerMessageHandlers = require('./messageHandlers');

/**
 * Socket.IO instance - exported for use in controllers
 */
let io = null;

/**
 * Get the Socket.IO instance
 * @returns {Server|null}
 */
const getIO = () => io;

/**
 * Initialize Socket.IO with the HTTP server
 * @param {http.Server} httpServer
 * @returns {Server}
 */
const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    // JWT Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            // Verify JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check for refresh token misuse
            if (decoded.tokenType === 'refresh') {
                return next(new Error('Access token required'));
            }

            // Fetch user
            const user = await User.findById(decoded.userId).select('-refreshToken');

            if (!user) {
                return next(new Error('User not found'));
            }

            if (!user.isActive) {
                return next(new Error('Account deactivated'));
            }

            // Attach user to socket
            socket.user = user;
            socket.userId = user._id.toString();
            socket.userRole = user.role;

            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new Error('Token expired'));
            }
            if (err.name === 'JsonWebTokenError') {
                return next(new Error('Invalid token'));
            }
            console.error('Socket auth error:', err);
            next(new Error('Authentication failed'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.user.name} (${socket.userId})`);

        // Join user's personal room for notifications
        socket.join(`user:${socket.userId}`);

        // Register event handlers
        registerBookingHandlers(io, socket);
        registerMessageHandlers(io, socket);

        // Handle errors
        socket.on('error', (error) => {
            console.error(`[Socket] Error for ${socket.userId}:`, error);
            socket.emit('error', { message: error.message || 'An error occurred' });
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log(`[Socket] User disconnected: ${socket.user.name} (${reason})`);
        });
    });

    console.log('[Socket] Socket.IO initialized');
    return io;
};

module.exports = {
    initializeSocket,
    getIO
};
