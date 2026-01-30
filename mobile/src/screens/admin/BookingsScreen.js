import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAdminBookings } from '../../hooks';
import { COLORS, BOOKING_STATES } from '../../config';

const BookingsScreen = ({ navigation }) => {
    const { bookings, loading, fetchBookings, cancelBooking, disputeBooking, forceCloseBooking } = useAdminBookings();
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case BOOKING_STATES.REQUESTED: return COLORS.warning;
            case BOOKING_STATES.ACCEPTED: return COLORS.primary;
            case BOOKING_STATES.IN_PROGRESS: return COLORS.secondary;
            case BOOKING_STATES.COMPLETED: return '#10B981';
            case BOOKING_STATES.DISPUTED: return COLORS.danger;
            case BOOKING_STATES.CANCELLED: return COLORS.textSecondary;
            default: return COLORS.textSecondary;
        }
    };

    const handleAction = (booking, action) => {
        const actionLabels = { cancel: 'Cancel', dispute: 'Mark Disputed', force: 'Force Close' };

        Alert.prompt(
            actionLabels[action],
            'Enter reason (required for audit):',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: action === 'cancel' || action === 'force' ? 'destructive' : 'default',
                    onPress: async (reason) => {
                        if (!reason?.trim()) {
                            Alert.alert('Error', 'Reason is required');
                            return;
                        }
                        setActionLoading(booking._id);
                        try {
                            if (action === 'cancel') await cancelBooking(booking._id, reason);
                            else if (action === 'dispute') await disputeBooking(booking._id, reason);
                            else if (action === 'force') await forceCloseBooking(booking._id, reason);
                            Alert.alert('Success', `Booking ${action}ed`);
                        } catch (err) {
                            Alert.alert('Error', err.message);
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const renderBooking = ({ item }) => {
        const isTerminal = [BOOKING_STATES.CLOSED, BOOKING_STATES.CANCELLED, BOOKING_STATES.FORCE_CLOSED].includes(item.status);

        return (
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

                <View style={styles.participants}>
                    <Text style={styles.participant}>Customer: {item.customer?.name}</Text>
                    {item.helper && <Text style={styles.participant}>Helper: {item.helper?.name}</Text>}
                </View>

                <Text style={styles.date}>
                    {new Date(item.scheduledAt).toLocaleString()}
                </Text>

                {!isTerminal && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => handleAction(item, 'cancel')}
                            disabled={actionLoading === item._id}
                        >
                            <Text style={styles.actionButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        {item.status !== BOOKING_STATES.DISPUTED && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.disputeButton]}
                                onPress={() => handleAction(item, 'dispute')}
                                disabled={actionLoading === item._id}
                            >
                                <Text style={styles.actionButtonText}>Dispute</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.actionButton, styles.forceButton]}
                            onPress={() => handleAction(item, 'force')}
                            disabled={actionLoading === item._id}
                        >
                            <Text style={styles.actionButtonText}>Force Close</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <FlatList
            data={bookings}
            keyExtractor={item => item._id}
            renderItem={renderBooking}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            ListEmptyComponent={
                <View style={styles.empty}><Text style={styles.emptyText}>No bookings</Text></View>
            }
        />
    );
};

const styles = StyleSheet.create({
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    bookingCard: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    serviceName: { fontSize: 18, fontWeight: '600', color: COLORS.text, flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    participants: { marginBottom: 8 },
    participant: { fontSize: 14, color: COLORS.textSecondary },
    date: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
    actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
    actionButton: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
    cancelButton: { backgroundColor: COLORS.textSecondary },
    disputeButton: { backgroundColor: COLORS.warning },
    forceButton: { backgroundColor: COLORS.danger },
    actionButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 16, color: COLORS.textSecondary }
});

export default BookingsScreen;
