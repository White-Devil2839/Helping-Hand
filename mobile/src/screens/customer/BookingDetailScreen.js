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
    const { closeBooking, rateBooking, loading: actionLoading } = useBookingActions();

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
            case BOOKING_STATES.REQUESTED: return COLORS.warning;
            case BOOKING_STATES.ACCEPTED: return COLORS.primary;
            case BOOKING_STATES.IN_PROGRESS: return COLORS.secondary;
            case BOOKING_STATES.COMPLETED: return '#10B981';
            case BOOKING_STATES.CLOSED: return COLORS.textSecondary;
            case BOOKING_STATES.CANCELLED: return COLORS.danger;
            default: return COLORS.textSecondary;
        }
    };

    const handleClose = async () => {
        Alert.alert('Close Booking', 'Are you sure you want to close this booking?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Close',
                onPress: async () => {
                    try {
                        await closeBooking(bookingId);
                        refetch();
                        Alert.alert('Success', 'Booking closed');
                    } catch (err) {
                        Alert.alert('Error', 'Failed to close booking');
                    }
                }
            }
        ]);
    };

    const handleRate = () => {
        Alert.prompt('Rate Helper', 'Enter rating (1-5):', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Submit',
                onPress: async (rating) => {
                    const numRating = parseInt(rating);
                    if (numRating >= 1 && numRating <= 5) {
                        try {
                            await rateBooking(bookingId, numRating);
                            refetch();
                            Alert.alert('Success', 'Rating submitted');
                        } catch (err) {
                            Alert.alert('Error', 'Failed to submit rating');
                        }
                    } else {
                        Alert.alert('Invalid', 'Please enter a number between 1 and 5');
                    }
                }
            }
        ], 'plain-text', '', 'number-pad');
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

    const isCustomer = booking.customer?._id === user?._id;
    const canClose = isCustomer && booking.status === BOOKING_STATES.COMPLETED;
    const canRate = isCustomer &&
        [BOOKING_STATES.COMPLETED, BOOKING_STATES.CLOSED].includes(booking.status) &&
        !booking.customerRating;
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

            {/* Helper Info */}
            {booking.helper && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Helper</Text>
                    <View style={styles.helperCard}>
                        <Text style={styles.helperName}>{booking.helper.name}</Text>
                        {booking.helper.helperProfile?.rating > 0 && (
                            <Text style={styles.helperRating}>⭐ {booking.helper.helperProfile.rating.toFixed(1)}</Text>
                        )}
                    </View>
                </View>
            )}

            {/* Rating */}
            {booking.customerRating && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Rating</Text>
                    <Text style={styles.rating}>{'⭐'.repeat(booking.customerRating)}</Text>
                    {booking.customerReview && <Text style={styles.review}>{booking.customerReview}</Text>}
                </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
                {canChat && (
                    <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() => navigation.navigate('Chat', { bookingId, booking })}
                    >
                        <Text style={styles.chatButtonText}>💬 Open Chat</Text>
                    </TouchableOpacity>
                )}

                {canClose && (
                    <TouchableOpacity
                        style={[styles.actionButton, actionLoading && styles.buttonDisabled]}
                        onPress={handleClose}
                        disabled={actionLoading}
                    >
                        <Text style={styles.actionButtonText}>Close Booking</Text>
                    </TouchableOpacity>
                )}

                {canRate && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rateButton]}
                        onPress={handleRate}
                    >
                        <Text style={styles.actionButtonText}>Rate Helper</Text>
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
    sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12 },
    serviceName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
    description: { fontSize: 16, color: COLORS.textSecondary, lineHeight: 24 },
    detailRow: { flexDirection: 'row', marginBottom: 12 },
    detailLabel: { width: 100, fontSize: 14, color: COLORS.textSecondary },
    detailValue: { flex: 1, fontSize: 14, color: COLORS.text },
    helperCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    helperName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    helperRating: { fontSize: 16, color: COLORS.warning },
    rating: { fontSize: 24 },
    review: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
    actions: { padding: 20, gap: 12 },
    chatButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 8, alignItems: 'center' },
    chatButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    actionButton: { backgroundColor: COLORS.secondary, padding: 16, borderRadius: 8, alignItems: 'center' },
    rateButton: { backgroundColor: COLORS.warning },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    buttonDisabled: { opacity: 0.6 }
});

export default BookingDetailScreen;
