import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';

// Screens
import HelperHomeScreen from '../screens/helper/HomeScreen';
import HelperAvailableBookingsScreen from '../screens/helper/AvailableBookingsScreen';
import HelperMyBookingsScreen from '../screens/helper/MyBookingsScreen';
import HelperBookingDetailScreen from '../screens/helper/BookingDetailScreen';
import HelperChatScreen from '../screens/helper/ChatScreen';
import HelperProfileScreen from '../screens/helper/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Available Jobs Stack
const AvailableStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff'
        }}
    >
        <Stack.Screen name="AvailableList" component={HelperAvailableBookingsScreen} options={{ title: 'Available Jobs' }} />
        <Stack.Screen name="BookingDetail" component={HelperBookingDetailScreen} options={{ title: 'Job Details' }} />
    </Stack.Navigator>
);

// My Jobs Stack
const MyJobsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff'
        }}
    >
        <Stack.Screen name="MyJobsList" component={HelperMyBookingsScreen} options={{ title: 'My Jobs' }} />
        <Stack.Screen name="BookingDetail" component={HelperBookingDetailScreen} options={{ title: 'Job Details' }} />
        <Stack.Screen name="Chat" component={HelperChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
);

const HelperStack = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: { paddingBottom: 5, height: 60 },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Available') iconName = focused ? 'search' : 'search-outline';
                    else if (route.name === 'MyJobs') iconName = focused ? 'briefcase' : 'briefcase-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                }
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={HelperHomeScreen}
                options={{
                    tabBarLabel: 'Dashboard',
                    headerShown: true,
                    headerStyle: { backgroundColor: COLORS.primary },
                    headerTintColor: '#fff',
                    title: 'Dashboard'
                }}
            />
            <Tab.Screen
                name="Available"
                component={AvailableStack}
                options={{ tabBarLabel: 'Find Jobs' }}
            />
            <Tab.Screen
                name="MyJobs"
                component={MyJobsStack}
                options={{ tabBarLabel: 'My Jobs' }}
            />
            <Tab.Screen
                name="Profile"
                component={HelperProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    headerShown: true,
                    headerStyle: { backgroundColor: COLORS.primary },
                    headerTintColor: '#fff',
                    title: 'My Profile'
                }}
            />
        </Tab.Navigator>
    );
};

export default HelperStack;
