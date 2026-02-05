import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../services';
import { COLORS, ROLES } from '../../config';

const UserDetailScreen = ({ route, navigation }) => {
    const { userId } = route.params;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserDetail();
    }, [userId]);

    const fetchUserDetail = async () => {
        try {
            const response = await api.get(`/admin/users/${userId}`);
            setUser(response.data.user);
        } catch (err) {
            Alert.alert('Error', 'Failed to load user details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!user) return null;

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case ROLES.ADMIN: return COLORS.danger;
            case ROLES.HELPER: return COLORS.secondary;
            case ROLES.CUSTOMER: return COLORS.primary;
            default: return COLORS.textSecondary;
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.phone}>{user.phone}</Text>
                    </View>
                    <View>
                        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
                            <Text style={styles.roleText}>{user.role}</Text>
                        </View>
                        {!user.isActive && (
                            <View style={[styles.statusBadge, { marginTop: 4 }]}>
                                <Text style={styles.statusText}>INACTIVE</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Account Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Information</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>User ID:</Text>
                    <Text style={styles.value}>{user._id}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={[styles.value, { color: user.isActive ? COLORS.secondary : COLORS.danger }]}>
                        {user.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Joined:</Text>
                    <Text style={styles.value}>{new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Last Updated:</Text>
                    <Text style={styles.value}>{new Date(user.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</Text>
                </View>
            </View>

            {/* Helper Profile (if helper) */}
            {user.role === ROLES.HELPER && user.helperProfile && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Helper Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Verification:</Text>
                        <Text style={[styles.value, { color: user.helperProfile.isVerified ? COLORS.secondary : COLORS.warning }]}>
                            {user.helperProfile.isVerified ? '✓ Verified' : '⏳ Pending'}
                        </Text>
                    </View>
                    {user.helperProfile.rating > 0 && (
                        <>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Rating:</Text>
                                <Text style={styles.value}>⭐ {user.helperProfile.rating.toFixed(1)}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Total Jobs:</Text>
                                <Text style={styles.value}>{user.helperProfile.totalBookings || 0}</Text>
                            </View>
                        </>
                    )}
                    {user.helperProfile.bio && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Bio:</Text>
                            <Text style={styles.value}>{user.helperProfile.bio}</Text>
                        </View>
                    )}
                    {user.helperProfile.services && user.helperProfile.services.length > 0 && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Services:</Text>
                            <View style={styles.servicesList}>
                                {user.helperProfile.services.map((service, index) => (
                                    <View key={index} style={styles.serviceBadge}>
                                        <Text style={styles.serviceText}>{service.icon} {service.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerCard: {
        backgroundColor: COLORS.surface,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
    name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    phone: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
    roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    roleText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
    statusBadge: { backgroundColor: COLORS.textSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    statusText: { color: '#fff', fontSize: 10, fontWeight: '600' },
    section: {
        backgroundColor: COLORS.surface,
        marginTop: 12,
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12
    },
    infoRow: { marginBottom: 12 },
    label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
    value: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
    servicesList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    serviceBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 8,
        marginBottom: 8
    },
    serviceText: { color: COLORS.primary, fontSize: 13, fontWeight: '500' }
});

export default UserDetailScreen;
