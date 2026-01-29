import React, { useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert
} from 'react-native';
import { useBooking, useBookingActions } from '../../hooks';
import { useBookingRoom } from '../../hooks/useSocket';
import { useAuth } from '../../context';
import { COLORS, BOOKING_STATES, TERMINAL_STATES } from '../../config';

const BookingDetailScreen = ({ route, navigation }) => {
    const { bookingId } = route.params;
    const { user } = useAuth();
    const { booking, loading, refetch, setBooking } = useBooking(bookingId);
    const { startBooking, completeBooking, loading: actionLoading } = useBookingActions();

    // Subscribe to real-time updates
    const onBookingUpdate = useCallback((data) => {
        if (data.status) {
            setBooking(prev => prev ? { ...prev, status: data.status } : prev);
        }
        refetch();
    }, [refetch, setBooking]);

    useBookingRoom(bookingId, onBookingUpdate);

    const getStatusColor = (status) => {
        switch (status) {
            case BOOKING_STATES.ACCEPTED: return COLORS.primary;
            case BOOKING_STATES.IN_PROGRESS: return COLORS.secondary;
            case BOOKING_STATES.COMPLETED: return '#10B981';
            default: return COLORS.textSecondary;
        }
    };

    const handleStart = async () => {
        Alert.alert('Start Work', 'Are you ready to start this job?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Start',
                onPress: async () => {
                    try {
                        await startBooking(bookingId);
                        refetch();
                        Alert.alert('Success', 'Job started!');
                    } catch (err) {
                        Alert.alert('Error', 'Failed to start job');
                    }
                }
            }
        ]);
    };

    const handleComplete = async () => {
        Alert.alert('Complete Job', 'Mark this job as complete?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Complete',
                onPress: async () => {
                    try {
                        await completeBooking(bookingId);
                        refetch();
                        Alert.alert('Success', 'Job marked as complete!');
                    } catch (err) {
                        Alert.alert('Error', 'Failed to complete job');
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={styles.loading}>
                <Text>Booking not found</Text>
            </View>
        );
    }

    const isHelper = booking.helper?._id === user?._id;
    const canStart = isHelper && booking.status === BOOKING_STATES.ACCEPTED;
    const canComplete = isHelper && booking.status === BOOKING_STATES.IN_PROGRESS;
    const canChat = !TERMINAL_STATES.includes(booking.status);

    return (
        <ScrollView style={styles.container}>
            {/* Status Header */}
            <View style={[styles.statusHeader, { backgroundColor: getStatusColor(booking.status) }]}>
                <Text style={styles.statusTitle}>{booking.status.replace('_', ' ')}</Text>
            </View>

            {/* Service Info */}
            <View style={styles.section}>
                <Text style={styles.serviceName}>{booking.service?.name}</Text>
                <Text style={styles.description}>{booking.description}</Text>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer</Text>
                <Text style={styles.customerName}>{booking.customer?.name}</Text>
                <Text style={styles.customerPhone}>{booking.customer?.phone}</Text>
            </View>

            {/* Details */}
            <View style={styles.section}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📍 Location</Text>
                    <Text style={styles.detailValue}>{booking.location?.address}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 Scheduled</Text>
                    <Text style={styles.detailValue}>
                        {new Date(booking.scheduledAt).toLocaleString()}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>⏱️ Duration</Text>
                    <Text style={styles.detailValue}>{booking.estimatedDuration} mins</Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {canChat && (
                    <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => navigation.navigate('Chat', { bookingId, booking })}
                    >
                        <Text style={styles.chatButtonText}>💬 Chat with Customer</Text>
                    </TouchableOpacity>
                )}

                {canStart && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.startButton, actionLoading && styles.buttonDisabled]}
                        onPress={handleStart}
                        disabled={actionLoading}
                    >
                        <Text style={styles.actionButtonText}>▶️ Start Work</Text>
                    </TouchableOpacity>
                )}

                {canComplete && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.completeButton, actionLoading && styles.buttonDisabled]}
                        onPress={handleComplete}
                        disabled={actionLoading}
                    >
                        <Text style={styles.actionButtonText}>✓ Mark Complete</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statusHeader: { padding: 20, alignItems: 'center' },
    statusTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
    section: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
    serviceName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
    description: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24 },
    customerName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    customerPhone: { fontSize: 14, color: COLORS.primary, marginTop: 4 },
    detailRow: { flexDirection: 'row', marginBottom: 12 },
    detailLabel: { width: 100, fontSize: 14, color: COLORS.textSecondary },
    detailValue: { flex: 1, fontSize: 14, color: COLORS.text },
    actions: { padding: 20, gap: 12 },
    chatButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
    chatButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    actionButton: { padding: 16, borderRadius: 8, alignItems: 'center' },
    startButton: { backgroundColor: COLORS.secondary },
    completeButton: { backgroundColor: '#10B981' },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    buttonDisabled: { opacity: 0.6 }
});

export default BookingDetailScreen;
