import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context';
import { useAdminHelpers, useAdminBookings } from '../../hooks';
import { COLORS, BOOKING_STATES } from '../../config';

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { helpers: pendingHelpers, loading: helpersLoading, fetchPendingHelpers } = useAdminHelpers();
    const { bookings, loading: bookingsLoading, fetchBookings } = useAdminBookings();

    useEffect(() => {
        fetchPendingHelpers();
        fetchBookings({ limit: 5 });
    }, [fetchPendingHelpers, fetchBookings]);

    const activeBookings = bookings.filter(b =>
        ![BOOKING_STATES.CLOSED, BOOKING_STATES.CANCELLED, BOOKING_STATES.FORCE_CLOSED].includes(b.status)
    );
    const disputedBookings = bookings.filter(b => b.status === BOOKING_STATES.DISPUTED);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Admin Dashboard</Text>
                <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => navigation.navigate('Helpers')}
                >
                    <Text style={styles.statNumber}>
                        {helpersLoading ? '...' : pendingHelpers.length}
                    </Text>
                    <Text style={styles.statLabel}>Pending Helpers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => navigation.navigate('Bookings')}
                >
                    <Text style={styles.statNumber}>
                        {bookingsLoading ? '...' : activeBookings.length}
                    </Text>
                    <Text style={styles.statLabel}>Active Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statCard, disputedBookings.length > 0 && styles.alertCard]}
                    onPress={() => navigation.navigate('Bookings')}
                >
                    <Text style={[styles.statNumber, disputedBookings.length > 0 && styles.alertText]}>
                        {bookingsLoading ? '...' : disputedBookings.length}
                    </Text>
                    <Text style={styles.statLabel}>Disputed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => navigation.navigate('AuditLog')}
                >
                    <Text style={styles.statNumber}>📋</Text>
                    <Text style={styles.statLabel}>View Audit Log</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Helpers')}
                >
                    <Text style={styles.actionText}>Review Pending Helpers</Text>
                    {pendingHelpers.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingHelpers.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Bookings')}
                >
                    <Text style={styles.actionText}>Manage Bookings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Users')}
                >
                    <Text style={styles.actionText}>User Management</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 20, backgroundColor: COLORS.primary },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10 },
    statCard: {
        width: '47%',
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    alertCard: { borderColor: COLORS.danger, borderWidth: 2 },
    statNumber: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
    alertText: { color: COLORS.danger },
    statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
    section: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
    actionButton: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    actionText: { fontSize: 16, color: COLORS.text },
    badge: { backgroundColor: COLORS.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' }
});

export default DashboardScreen;
