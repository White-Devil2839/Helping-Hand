import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, storeTokens, clearTokens, getAccessToken, connectSocket, disconnectSocket } from '../services';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Connect socket when user is authenticated
    useEffect(() => {
        if (user) {
            connectSocket();
        } else {
            disconnectSocket();
        }
    }, [user]);

    const checkAuth = async () => {
        try {
            const token = await getAccessToken();
            if (token) {
                const response = await api.get('/users/me');
                setUser(response.data.user);
            }
        } catch (err) {
            // Token invalid or expired - clear it
            await clearTokens();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const requestOtp = async (phone) => {
        setError(null);
        try {
            const response = await api.post('/auth/request-otp', { phone });
            return response.data;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to request OTP');
            throw err;
        }
    };

    const verifyOtp = async (phone, otp, name = null) => {
        setError(null);
        try {
            const payload = { phone, otp };
            if (name) payload.name = name;

            const response = await api.post('/auth/verify-otp', payload);
            const { accessToken, refreshToken, user: userData } = response.data;

            await storeTokens(accessToken, refreshToken);
            setUser(userData);

            return response.data;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to verify OTP');
            throw err;
        }
    };

    const logout = async () => {
        await clearTokens();
        disconnectSocket();
        setUser(null);
    };

    const updateProfile = async (updates) => {
        try {
            const response = await api.patch('/users/me', updates);
            setUser(response.data.user);
            return response.data.user;
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
            throw err;
        }
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'customer',
        isHelper: user?.role === 'helper',
        isAdmin: user?.role === 'admin',
        isVerifiedHelper: user?.role === 'helper' && user?.helperProfile?.isVerified,
        requestOtp,
        verifyOtp,
        logout,
        updateProfile,
        refreshUser: checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
