require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');

const connectDB = require('./config/db');
const { initializeSocket } = require('./socket');
const { notFound, errorHandler } = require('./middleware');
const {
    authRoutes,
    userRoutes,
    serviceRoutes,
    bookingRoutes,
    messageRoutes,
    adminRoutes
} = require('./routes');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
initializeSocket(server);

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Helping Hand API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`
  Port: ${PORT}                                         
  Socket.IO: enabled                                  
  `);
});

// Export for Socket.IO integration later
module.exports = { app, server };
