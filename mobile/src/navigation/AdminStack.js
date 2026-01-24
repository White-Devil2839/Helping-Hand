import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';

// Screens
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import AdminUsersScreen from '../screens/admin/UsersScreen';
import AdminUserDetailScreen from '../screens/admin/UserDetailScreen';
import AdminHelpersScreen from '../screens/admin/HelpersScreen';
import AdminBookingsScreen from '../screens/admin/BookingsScreen';
import AdminBookingDetailScreen from '../screens/admin/BookingDetailScreen';
import AdminAuditLogScreen from '../screens/admin/AuditLogScreen';
import AdminProfileScreen from '../screens/admin/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Users Stack
const UsersStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff'
        }}
    >
        <Stack.Screen name="UsersList" component={AdminUsersScreen} options={{ title: 'Users' }} />
        <Stack.Screen name="UserDetail" component={AdminUserDetailScreen} options={{ title: 'User Details' }} />
    </Stack.Navigator>
);

// Helpers Stack
const HelpersStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: '#fff'
        }}
    >
        <Stack.Screen name="HelpersList" component={AdminHelpersScreen} options={{ title: 'Helpers' }} />
        <Stack.Screen name="HelperDetail" component={AdminUserDetailScreen} options={{ title: 'Helper Details' }} />
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
        <Stack.Screen name="BookingsList" component={AdminBookingsScreen} options={{ title: 'All Bookings' }} />
        <Stack.Screen name="BookingDetail" component={AdminBookingDetailScreen} options={{ title: 'Booking Details' }} />
    </Stack.Navigator>
);

const AdminStack = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: { paddingBottom: 5, height: 60 },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'Helpers') iconName = focused ? 'person-add' : 'person-add-outline';
                    else if (route.name === 'Bookings') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'AuditLog') iconName = focused ? 'document-text' : 'document-text-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                }
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={AdminDashboardScreen}
                options={{
                    tabBarLabel: 'Dashboard',
                    headerShown: true,
                    headerStyle: { backgroundColor: COLORS.primary },
                    headerTintColor: '#fff',
                    title: 'Admin Dashboard'
                }}
            />
            <Tab.Screen
                name="Users"
                component={UsersStack}
                options={{ tabBarLabel: 'Users' }}
            />
            <Tab.Screen
                name="Helpers"
                component={HelpersStack}
                options={{ tabBarLabel: 'Helpers' }}
            />
            <Tab.Screen
                name="Bookings"
                component={BookingsStack}
                options={{ tabBarLabel: 'Bookings' }}
            />
            <Tab.Screen
                name="AuditLog"
                component={AdminAuditLogScreen}
                options={{
                    tabBarLabel: 'Audit',
                    headerShown: true,
                    headerStyle: { backgroundColor: COLORS.primary },
                    headerTintColor: '#fff',
                    title: 'Audit Log'
                }}
            />
            <Tab.Screen
                name="Profile"
                component={AdminProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    headerShown: true,
                    headerStyle: { backgroundColor: COLORS.primary },
                    headerTintColor: '#fff',
                    title: 'Admin Profile'
                }}
            />
        </Tab.Navigator>
    );
};

export default AdminStack;
