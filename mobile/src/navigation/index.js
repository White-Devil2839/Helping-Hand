import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context';

import AuthStack from './AuthStack';
import CustomerStack from './CustomerStack';
import HelperStack from './HelperStack';
import AdminStack from './AdminStack';

const AppNavigator = () => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        // TODO: Replace with splash screen
        return null;
    }

    return (
        <NavigationContainer>
            {!isAuthenticated ? (
                <AuthStack />
            ) : user.role === 'admin' ? (
                <AdminStack />
            ) : user.role === 'helper' ? (
                <HelperStack />
            ) : (
                <CustomerStack />
            )}
        </NavigationContainer>
    );
};

export default AppNavigator;
