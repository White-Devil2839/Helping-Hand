import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useAvailableBookings, useBookingActions } from '../../hooks';
import { useBookingNotifications } from '../../hooks/useSocket';
import { COLORS } from '../../config';

const AvailableBookingsScreen = ({ navigation }) => {
    const { bookings, loading, refetch } = useAvailableBookings();
    const { acceptBooking, loading: actionLoading } = useBookingActions();
    const [refreshing, setRefreshing] = React.useState(false);

    // Listen for new bookings
    const onNewBooking = useCallback(() => {
        refetch();
    }, [refetch]);

    useBookingNotifications(onNewBooking);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleAccept = async (booking) => {
        Alert.alert(
            'Accept Job',
            `Accept "${booking.service?.name}" at ${booking.location?.address}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        try {
                            const updated = await acceptBooking(booking._id);
                            Alert.alert('Success', 'Job accepted!', [
                                {
                                    text: 'View', onPress: () => navigation.navigate('MyJobs', {
                                        screen: 'BookingDetail',
                                        params: { bookingId: updated._id }
                                    })
                                }
                            ]);
                            refetch();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to accept job');
                        }
                    }
                }
            ]
        );
    };

    const renderBooking = ({ item }) => (
        <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
                <Text style={styles.serviceName}>{item.service?.name}</Text>
                <Text style={styles.category}>{item.service?.category}</Text>
            </View>

            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

            <View style={styles.details}>
                <Text style={styles.detail}>📍 {item.location?.address}</Text>
                <Text style={styles.detail}>
                    📅 {new Date(item.scheduledAt).toLocaleDateString()} at {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.detail}>👤 {item.customer?.name}</Text>
            </View>

            <TouchableOpacity
                style={[styles.acceptButton, actionLoading && styles.buttonDisabled]}
                onPress={() => handleAccept(item)}
                disabled={actionLoading}
            >
                <Text style={styles.acceptButtonText}>Accept Job</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <FlatList
            data={bookings}
            keyExtractor={item => item._id}
            renderItem={renderBooking}
            contentContainerStyle={styles.list}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No available jobs</Text>
                    <Text style={styles.emptyHint}>New jobs will appear here</Text>
                </View>
            }
        />
    );
};

const styles = StyleSheet.create({
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
    serviceName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    category: { fontSize: 12, color: COLORS.primary, textTransform: 'capitalize' },
    description: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
    details: { marginBottom: 16 },
    detail: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
    acceptButton: { backgroundColor: COLORS.secondary, padding: 14, borderRadius: 8, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 18, color: COLORS.textSecondary },
    emptyHint: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 }
});

export default AvailableBookingsScreen;
