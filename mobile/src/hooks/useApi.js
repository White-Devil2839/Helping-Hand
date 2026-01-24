import { useState, useEffect, useCallback } from 'react';
import { api } from '../services';

/**
 * Hook for fetching services list
 */
export const useServices = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/services');
            setServices(response.data.services);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch services');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    return { services, loading, error, refetch: fetchServices };
};

/**
 * Hook for fetching user's bookings
 */
export const useBookings = (status = null) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const fetchBookings = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (status) params.status = status;

            const response = await api.get('/bookings', { params });
            setBookings(response.data.bookings);
            setPagination(response.data.pagination);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    return { bookings, loading, error, pagination, refetch: fetchBookings };
};

/**
 * Hook for fetching available bookings (for helpers)
 */
export const useAvailableBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/bookings/available');
            setBookings(response.data.bookings);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch available bookings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    return { bookings, loading, error, refetch: fetchBookings };
};

/**
 * Hook for fetching a single booking
 */
export const useBooking = (bookingId) => {
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBooking = useCallback(async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const response = await api.get(`/bookings/${bookingId}`);
            setBooking(response.data.booking);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch booking');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    return { booking, loading, error, refetch: fetchBooking, setBooking };
};

/**
 * Hook for booking actions
 */
export const useBookingActions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createBooking = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/bookings', data);
            return response.data.booking;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create booking');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const acceptBooking = async (bookingId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.patch(`/bookings/${bookingId}/accept`);
            return response.data.booking;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to accept booking');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const startBooking = async (bookingId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.patch(`/bookings/${bookingId}/start`);
            return response.data.booking;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start booking');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const completeBooking = async (bookingId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.patch(`/bookings/${bookingId}/complete`);
            return response.data.booking;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to complete booking');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const closeBooking = async (bookingId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.patch(`/bookings/${bookingId}/close`);
            return response.data.booking;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to close booking');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const rateBooking = async (bookingId, rating, review = null) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/bookings/${bookingId}/rate`, { rating, review });
            return response.data.booking;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to rate booking');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        createBooking,
        acceptBooking,
        startBooking,
        completeBooking,
        closeBooking,
        rateBooking
    };
};

/**
 * Hook for fetching messages
 */
export const useMessages = (bookingId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMessages = useCallback(async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const response = await api.get(`/messages/${bookingId}`);
            setMessages(response.data.messages);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch messages');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const addMessage = (message) => {
        setMessages(prev => [...prev, message]);
    };

    return { messages, loading, error, refetch: fetchMessages, addMessage, setMessages };
};
