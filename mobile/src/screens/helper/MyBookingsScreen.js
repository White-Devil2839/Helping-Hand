import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useBookings } from '../../hooks';
import { COLORS, BOOKING_STATES, TERMINAL_STATES } from '../../config';

const MyBookingsScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('active');
    const { bookings, loading, refetch } = useBookings();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'active') {
            return !TERMINAL_STATES.includes(b.status);
        }
        return TERMINAL_STATES.includes(b.status);
    });

    const getStatusColor = (status) => {
        switch (status) {
            case BOOKING_STATES.ACCEPTED: return COLORS.primary;
            case BOOKING_STATES.IN_PROGRESS: return COLORS.secondary;
            case BOOKING_STATES.COMPLETED: return '#10B981';
            case BOOKING_STATES.CLOSED: return COLORS.textSecondary;
            default: return COLORS.textSecondary;
        }
    };

    const renderBooking = ({ item }) => (
        <TouchableOpacity
            style={styles.bookingCard}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
        >
            <View style={styles.bookingHeader}>
                <Text style={styles.serviceName}>{item.service?.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
                </View>
            </View>

            <Text style={styles.customerName}>Customer: {item.customer?.name}</Text>

            <View style={styles.bookingFooter}>
                <Text style={styles.detail}>📍 {item.location?.address}</Text>
                <Text style={styles.detail}>
                    📅 {new Date(item.scheduledAt).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Completed</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    keyExtractor={item => item._id}
                    renderItem={renderBooking}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No {activeTab} jobs</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    tabs: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    tab: { flex: 1, paddingVertical: 16, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabText: { fontSize: 16, color: COLORS.textSecondary },
    activeTabText: { color: COLORS.primary, fontWeight: '600' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    bookingCard: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    serviceName: { fontSize: 18, fontWeight: '600', color: COLORS.text, flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    customerName: { fontSize: 14, color: COLORS.primary, marginBottom: 8 },
    bookingFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    detail: { fontSize: 12, color: COLORS.textSecondary },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: COLORS.textSecondary }
});

export default MyBookingsScreen;
