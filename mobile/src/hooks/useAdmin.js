import { useState, useCallback } from 'react';
import { api } from '../services';

/**
 * Hook for admin user management
 */
export const useAdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users', { params });
            setUsers(response.data.users);
            setError(null);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, []);

    const deactivateUser = async (userId, reason) => {
        try {
            await api.patch(`/admin/users/${userId}/deactivate`, { reason });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: false } : u));
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to deactivate user');
        }
    };

    const activateUser = async (userId) => {
        try {
            await api.patch(`/admin/users/${userId}/activate`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: true } : u));
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to activate user');
        }
    };

    return { users, loading, error, fetchUsers, deactivateUser, activateUser };
};

/**
 * Hook for admin helper management
 */
export const useAdminHelpers = () => {
    const [helpers, setHelpers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPendingHelpers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/helpers/pending');
            setHelpers(response.data.helpers);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch helpers');
        } finally {
            setLoading(false);
        }
    }, []);

    const verifyHelper = async (helperId, reason) => {
        try {
            await api.patch(`/admin/helpers/${helperId}/verify`, { reason });
            setHelpers(prev => prev.filter(h => h._id !== helperId));
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to verify helper');
        }
    };

    const unverifyHelper = async (helperId, reason) => {
        try {
            await api.patch(`/admin/helpers/${helperId}/unverify`, { reason });
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to unverify helper');
        }
    };

    return { helpers, loading, error, fetchPendingHelpers, verifyHelper, unverifyHelper };
};

/**
 * Hook for admin booking management
 */
export const useAdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBookings = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await api.get('/admin/bookings', { params });
            setBookings(response.data.bookings);
            setError(null);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelBooking = async (bookingId, reason) => {
        try {
            await api.patch(`/admin/bookings/${bookingId}/cancel`, { reason });
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'CANCELLED' } : b));
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to cancel booking');
        }
    };

    const disputeBooking = async (bookingId, reason) => {
        try {
            await api.patch(`/admin/bookings/${bookingId}/dispute`, { reason });
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'DISPUTED' } : b));
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to mark disputed');
        }
    };

    const forceCloseBooking = async (bookingId, reason) => {
        try {
            await api.patch(`/admin/bookings/${bookingId}/force-close`, { reason });
            setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'FORCE_CLOSED' } : b));
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Failed to force close');
        }
    };

    return { bookings, loading, error, fetchBookings, cancelBooking, disputeBooking, forceCloseBooking };
};

/**
 * Hook for audit log
 */
export const useAuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const fetchLogs = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await api.get('/admin/audit-log', { params });
            setLogs(response.data.actions || []);
            setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch audit log');
        } finally {
            setLoading(false);
        }
    }, []);

    return { logs, loading, error, pagination, fetchLogs };
};
