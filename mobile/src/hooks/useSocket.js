import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context';
import { connectSocket, disconnectSocket, getSocket, joinBookingRoom, leaveBookingRoom } from '../services/socket';

/**
 * Hook for managing socket connection
 */
export const useSocket = () => {
    const { isAuthenticated } = useAuth();
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isAuthenticated) {
            connectSocket()
                .then((socket) => {
                    if (socket) {
                        setConnected(socket.connected);

                        socket.on('connect', () => setConnected(true));
                        socket.on('disconnect', () => setConnected(false));
                        socket.on('connect_error', (err) => setError(err.message));
                    }
                })
                .catch((err) => setError(err.message));
        }

        return () => {
            // Don't disconnect on unmount - managed by AuthContext
        };
    }, [isAuthenticated]);

    return { connected, error };
};

/**
 * Hook for booking room and real-time updates
 */
export const useBookingRoom = (bookingId, onBookingUpdate) => {
    const [joined, setJoined] = useState(false);
    const [usersInRoom, setUsersInRoom] = useState([]);

    useEffect(() => {
        if (!bookingId) return;

        const socket = getSocket();
        if (!socket?.connected) return;

        // Join room
        joinBookingRoom(bookingId);

        // Event handlers
        const handleJoined = (data) => {
            if (data.bookingId === bookingId) {
                setJoined(true);
            }
        };

        const handleUserJoined = (data) => {
            if (data.bookingId === bookingId) {
                setUsersInRoom(prev => [...prev, { userId: data.userId, name: data.userName }]);
            }
        };

        const handleUserLeft = (data) => {
            if (data.bookingId === bookingId) {
                setUsersInRoom(prev => prev.filter(u => u.userId !== data.userId));
            }
        };

        const handleStatusChanged = (data) => {
            if (data.bookingId === bookingId && onBookingUpdate) {
                onBookingUpdate(data);
            }
        };

        socket.on('booking:joined', handleJoined);
        socket.on('booking:user-joined', handleUserJoined);
        socket.on('booking:user-left', handleUserLeft);
        socket.on('booking:status-changed', handleStatusChanged);

        return () => {
            leaveBookingRoom(bookingId);
            socket.off('booking:joined', handleJoined);
            socket.off('booking:user-joined', handleUserJoined);
            socket.off('booking:user-left', handleUserLeft);
            socket.off('booking:status-changed', handleStatusChanged);
            setJoined(false);
        };
    }, [bookingId, onBookingUpdate]);

    return { joined, usersInRoom };
};

/**
 * Hook for real-time chat in a booking room
 */
export const useChat = (bookingId) => {
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef({});

    useEffect(() => {
        if (!bookingId) return;

        const socket = getSocket();
        if (!socket?.connected) return;

        const handleNewMessage = (message) => {
            if (message.booking === bookingId) {
                setMessages(prev => [...prev, message]);
            }
        };

        const handleTyping = (data) => {
            if (data.bookingId === bookingId) {
                if (data.isTyping) {
                    setTypingUsers(prev => {
                        if (!prev.find(u => u.userId === data.userId)) {
                            return [...prev, { userId: data.userId, name: data.userName }];
                        }
                        return prev;
                    });

                    // Clear after 3 seconds
                    if (typingTimeoutRef.current[data.userId]) {
                        clearTimeout(typingTimeoutRef.current[data.userId]);
                    }
                    typingTimeoutRef.current[data.userId] = setTimeout(() => {
                        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
                    }, 3000);
                } else {
                    setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
                }
            }
        };

        const handleReadReceipt = (data) => {
            if (data.bookingId === bookingId) {
                setMessages(prev => prev.map(msg => {
                    if (data.messageIds.includes(msg._id)) {
                        return {
                            ...msg,
                            readBy: [...(msg.readBy || []), { user: data.readBy.userId, readAt: data.readAt }]
                        };
                    }
                    return msg;
                }));
            }
        };

        socket.on('message:new', handleNewMessage);
        socket.on('booking:user-typing', handleTyping);
        socket.on('message:read-receipt', handleReadReceipt);

        return () => {
            socket.off('message:new', handleNewMessage);
            socket.off('booking:user-typing', handleTyping);
            socket.off('message:read-receipt', handleReadReceipt);

            Object.values(typingTimeoutRef.current).forEach(clearTimeout);
        };
    }, [bookingId]);

    const initMessages = useCallback((initialMessages) => {
        setMessages(initialMessages);
    }, []);

    return { messages, typingUsers, initMessages, setMessages };
};

/**
 * Hook for global booking notifications
 */
export const useBookingNotifications = (onNewBooking, onBookingUpdate) => {
    useEffect(() => {
        const socket = getSocket();
        if (!socket?.connected) return;

        const handleNewAvailable = (data) => {
            if (onNewBooking) onNewBooking(data);
        };

        const handleUpdate = (data) => {
            if (onBookingUpdate) onBookingUpdate(data);
        };

        socket.on('booking:new-available', handleNewAvailable);
        socket.on('booking:updated', handleUpdate);
        socket.on('booking:accepted', handleUpdate);

        return () => {
            socket.off('booking:new-available', handleNewAvailable);
            socket.off('booking:updated', handleUpdate);
            socket.off('booking:accepted', handleUpdate);
        };
    }, [onNewBooking, onBookingUpdate]);
};
