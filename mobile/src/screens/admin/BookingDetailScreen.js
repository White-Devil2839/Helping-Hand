import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useBooking } from '../../hooks';
import { useAdminBookings } from '../../hooks';
import { COLORS, BOOKING_STATES, TERMINAL_STATES } from '../../config';

const BookingDetailScreen = ({ route, navigation }) => {
    const { bookingId } = route.params;
    const { booking, loading, error, refetch } = useBooking(bookingId);
    const { cancelBooking, disputeBooking, forceCloseBooking } = useAdminBookings();
    const [actionLoading, setActionLoading] = useState(null);

    const getStatusColor = (status) => {
        switch (status) {
            case BOOKING_STATES.REQUESTED: return COLORS.warning;
            case BOOKING_STATES.ACCEPTED: return COLORS.primary;
            case BOOKING_STATES.IN_PROGRESS: return COLORS.secondary;
            case BOOKING_STATES.COMPLETED: return '#10B981';
            case BOOKING_STATES.CLOSED: return COLORS.textSecondary;
            case BOOKING_STATES.DISPUTED: return COLORS.danger;
            case BOOKING_STATES.CANCELLED: return COLORS.textSecondary;
            default: return COLORS.textSecondary;
        }
    };

    const handleAction = (actionType) => {
        const labels = {
            cancel: { title: 'Cancel Booking', action: cancelBooking },
            dispute: { title: 'Mark as Disputed', action: disputeBooking },
            force: { title: 'Force Close', action: forceCloseBooking }
        };

        Alert.alert(
            labels[actionType].title,
            'Enter reason for this action:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: actionType === 'cancel' || actionType === 'force' ? 'destructive' : 'default',
                    onPress: async () => {
                        setActionLoading(actionType);
                        try {
                            await labels[actionType].action(bookingId, 'Admin action via mobile');
                            Alert.alert('Success', 'Action completed');
                            refetch();
                        } catch (err) {
                            Alert.alert('Error', err.message);
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (error || !booking) {
        return (
            <View style={styles.loading}>
                <Text style={styles.error}>{error || 'Booking not found'}</Text>
            </View>
        );
    }

    const isTerminal = TERMINAL_STATES.includes(booking.status);

    return (
        <ScrollView style={styles.container}>
            {/* Status Header */}
            <View style={[styles.statusHeader, { backgroundColor: getStatusColor(booking.status) }]}>
                <Text style={styles.statusText}>{booking.status.replace('_', ' ')}</Text>
            </View>

            {/* Service Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service</Text>
                <Text style={styles.serviceName}>{booking.service?.name}</Text>
                <Text style={styles.description}>{booking.description}</Text>
            </View>

            {/* Parties */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer</Text>
                <Text style={styles.partyName}>{booking.customer?.name}</Text>
                <Text style={styles.partyPhone}>{booking.customer?.phone}</Text>
            </View>

            {booking.helper && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Helper</Text>
                    <Text style={styles.partyName}>{booking.helper?.name}</Text>
                    <Text style={styles.partyPhone}>{booking.helper?.phone}</Text>
                </View>
            )}

            {/* Location & Schedule */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{booking.location?.address}</Text>
                <Text style={styles.detailLabel}>Scheduled:</Text>
                <Text style={styles.detailValue}>{new Date(booking.scheduledAt).toLocaleString()}</Text>
            </View>

            {/* Rating if exists */}
            {booking.rating && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rating</Text>
                    <Text style={styles.rating}>{'⭐'.repeat(booking.rating.score)}</Text>
                    {booking.rating.comment && (
                        <Text style={styles.ratingComment}>"{booking.rating.comment}"</Text>
                    )}
                </View>
            )}

            {/* Status History */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status History</Text>
                {booking.statusHistory?.slice().reverse().map((entry, idx) => (
                    <View key={idx} style={styles.historyItem}>
                        <View style={[styles.historyDot, { backgroundColor: getStatusColor(entry.status) }]} />
                        <View style={styles.historyContent}>
                            <Text style={styles.historyStatus}>{entry.status.replace('_', ' ')}</Text>
                            <Text style={styles.historyDate}>
                                {new Date(entry.changedAt).toLocaleString()}
                            </Text>
                            {entry.reason && <Text style={styles.historyReason}>{entry.reason}</Text>}
                        </View>
                    </View>
                ))}
            </View>

            {/* Admin Actions */}
            {!isTerminal && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Admin Actions</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => handleAction('cancel')}
                            disabled={actionLoading === 'cancel'}
                        >
                            <Text style={styles.actionButtonText}>
                                {actionLoading === 'cancel' ? '...' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>

                        {booking.status !== BOOKING_STATES.DISPUTED && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.disputeButton]}
                                onPress={() => handleAction('dispute')}
                                disabled={actionLoading === 'dispute'}
                            >
                                <Text style={styles.actionButtonText}>
                                    {actionLoading === 'dispute' ? '...' : 'Dispute'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.actionButton, styles.forceButton]}
                            onPress={() => handleAction('force')}
                            disabled={actionLoading === 'force'}
                        >
                            <Text style={styles.actionButtonText}>
                                {actionLoading === 'force' ? '...' : 'Force Close'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error: { color: COLORS.danger, fontSize: 16 },
    statusHeader: { padding: 16, alignItems: 'center' },
    statusText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    section: {
        backgroundColor: COLORS.surface,
        padding: 16,
        marginTop: 12,
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    sectionTitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
    serviceName: { fontSize: 20, fontWeight: '600', color: COLORS.text },
    description: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
    partyName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    partyPhone: { fontSize: 14, color: COLORS.primary, marginTop: 2 },
    detailLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
    detailValue: { fontSize: 14, color: COLORS.text },
    rating: { fontSize: 24 },
    ratingComment: { fontSize: 14, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: 8 },
    historyItem: { flexDirection: 'row', marginBottom: 12 },
    historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
    historyContent: { flex: 1 },
    historyStatus: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    historyDate: { fontSize: 12, color: COLORS.textSecondary },
    historyReason: { fontSize: 12, color: COLORS.warning, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8 },
    actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: COLORS.textSecondary },
    disputeButton: { backgroundColor: COLORS.warning },
    forceButton: { backgroundColor: COLORS.danger },
    actionButtonText: { color: '#fff', fontWeight: '600' }
});

export default BookingDetailScreen;
