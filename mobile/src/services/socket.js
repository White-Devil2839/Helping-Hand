import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { getAccessToken } from './api';

let socket = null;

/**
 * Initialize socket connection with JWT auth
 */
export const connectSocket = async () => {
    if (socket?.connected) {
        return socket;
    }

    const token = await getAccessToken();
    if (!token) {
        console.warn('[Socket] No token available');
        return null;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
    });

    socket.on('error', (error) => {
        console.error('[Socket] Error:', error);
    });

    return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

/**
 * Get current socket instance
 */
export const getSocket = () => socket;

/**
 * Join a booking room
 */
export const joinBookingRoom = (bookingId) => {
    if (!socket?.connected) {
        console.warn('[Socket] Not connected');
        return;
    }
    socket.emit('booking:join', { bookingId });
};

/**
 * Leave a booking room
 */
export const leaveBookingRoom = (bookingId) => {
    if (!socket?.connected) return;
    socket.emit('booking:leave', { bookingId });
};

/**
 * Send a message in booking chat
 */
export const sendMessage = (bookingId, content, messageType = 'text') => {
    if (!socket?.connected) {
        console.warn('[Socket] Not connected');
        return false;
    }
    socket.emit('message:send', { bookingId, content, messageType });
    return true;
};

/**
 * Mark messages as read
 */
export const markMessagesRead = (bookingId, messageIds) => {
    if (!socket?.connected) return;
    socket.emit('message:read', { bookingId, messageIds });
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = (bookingId, isTyping) => {
    if (!socket?.connected) return;
    socket.emit('booking:typing', { bookingId, isTyping });
};

export default {
    connectSocket,
    disconnectSocket,
    getSocket,
    joinBookingRoom,
    leaveBookingRoom,
    sendMessage,
    markMessagesRead,
    sendTypingIndicator
};
