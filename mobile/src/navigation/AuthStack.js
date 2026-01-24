import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { COLORS } from '../config';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
            }}
        >
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ title: 'Welcome' }}
            />
            <Stack.Screen
                name="Otp"
                component={OtpScreen}
                options={{ title: 'Verify Phone' }}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: 'Create Account' }}
            />
        </Stack.Navigator>
    );
};

export default AuthStack;
