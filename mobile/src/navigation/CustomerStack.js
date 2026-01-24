import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';

// Screens
import CustomerHomeScreen from '../screens/customer/HomeScreen';
import CustomerBookingsScreen from '../screens/customer/BookingsScreen';
import CustomerBookingDetailScreen from '../screens/customer/BookingDetailScreen';
import CustomerNewBookingScreen from '../screens/customer/NewBookingScreen';
import CustomerChatScreen from '../screens/customer/ChatScreen';
import CustomerProfileScreen from '../screens/customer/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
const HomeStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff'
        }}
    >
        <Stack.Screen name="HomeMain" component={CustomerHomeScreen} options={{ title: 'Helping Hand' }} />
        <Stack.Screen name="NewBooking" component={CustomerNewBookingScreen} options={{ title: 'New Booking' }} />
    </Stack.Navigator>
);

// Bookings Stack
const BookingsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff'
        }}
    >
        <Stack.Screen name="BookingsList" component={CustomerBookingsScreen} options={{ title: 'My Bookings' }} />
        <Stack.Screen name="BookingDetail" component={CustomerBookingDetailScreen} options={{ title: 'Booking Details' }} />
        <Stack.Screen name="Chat" component={CustomerChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
);

const CustomerStack = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: { paddingBottom: 5, height: 60 },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Bookings') iconName = focused ? 'list' : 'list-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                }
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{ tabBarLabel: 'Home' }}
            />
            <Tab.Screen
                name="Bookings"
                component={BookingsStack}
                options={{ tabBarLabel: 'Bookings' }}
            />
            <Tab.Screen
                name="Profile"
                component={CustomerProfileScreen}
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

export default CustomerStack;
