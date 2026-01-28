import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context';
import { useServices, useBookings } from '../../hooks';
import { COLORS, BOOKING_STATES } from '../../config';

const HomeScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { services, loading: servicesLoading } = useServices();
    const { bookings, loading: bookingsLoading } = useBookings();

    // Get recent active bookings
    const activeBookings = bookings.filter(b =>
        ![BOOKING_STATES.CLOSED, BOOKING_STATES.CANCELLED, BOOKING_STATES.FORCE_CLOSED].includes(b.status)
    ).slice(0, 3);

    const getStatusColor = (status) => {
        switch (status) {
            case BOOKING_STATES.REQUESTED: return COLORS.warning;
            case BOOKING_STATES.ACCEPTED: return COLORS.primary;
            case BOOKING_STATES.IN_PROGRESS: return COLORS.secondary;
            case BOOKING_STATES.COMPLETED: return '#10B981';
            default: return COLORS.textSecondary;
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, {user?.name}!</Text>
                <Text style={styles.subtitle}>What do you need help with today?</Text>
            </View>

            {/* Services */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                {servicesLoading ? (
                    <ActivityIndicator color={COLORS.primary} />
                ) : (
                    <View style={styles.servicesGrid}>
                        {services.map((service) => (
                            <TouchableOpacity
                                key={service._id}
                                style={styles.serviceCard}
                                onPress={() => navigation.navigate('NewBooking', { service })}
                            >
                                <Text style={styles.serviceIcon}>
                                    {service.category === 'home' ? '🏠' :
                                        service.category === 'errands' ? '🛒' :
                                            service.category === 'tech' ? '💻' :
                                                service.category === 'care' ? '❤️' : '🔧'}
                                </Text>
                                <Text style={styles.serviceName}>{service.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Active Bookings */}
            {activeBookings.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Active Bookings</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {activeBookings.map((booking) => (
                        <TouchableOpacity
                            key={booking._id}
                            style={styles.bookingCard}
                            onPress={() => navigation.navigate('Bookings', {
                                screen: 'BookingDetail',
                                params: { bookingId: booking._id }
                            })}
                        >
                            <View style={styles.bookingInfo}>
                                <Text style={styles.bookingService}>{booking.service?.name}</Text>
                                <Text style={styles.bookingDate}>
                                    {new Date(booking.scheduledAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                                <Text style={styles.statusText}>{booking.status.replace('_', ' ')}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <TouchableOpacity
                style={styles.newBookingButton}
                onPress={() => navigation.navigate('NewBooking')}
            >
                <Text style={styles.newBookingText}>+ Create New Booking</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 20, backgroundColor: COLORS.primary },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
    section: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
    seeAll: { color: COLORS.primary, fontWeight: '500' },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    serviceCard: {
        width: '30%',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    serviceIcon: { fontSize: 28, marginBottom: 8 },
    serviceName: { fontSize: 11, color: COLORS.text, textAlign: 'center' },
    bookingCard: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    bookingInfo: { flex: 1 },
    bookingService: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    bookingDate: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    newBookingButton: {
        margin: 20,
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    newBookingText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default HomeScreen;
