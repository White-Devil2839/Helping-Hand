import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context';
import { COLORS } from '../../config';

const HomeScreen = () => {
    const { user, isVerifiedHelper } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, {user?.name}!</Text>
                {isVerifiedHelper ? (
                    <View style={styles.badge}><Text style={styles.badgeText}>✓ Verified</Text></View>
                ) : (
                    <View style={[styles.badge, styles.pendingBadge]}><Text style={styles.badgeText}>Pending Verification</Text></View>
                )}
            </View>

            <View style={styles.stats}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{user?.helperProfile?.totalBookings || 0}</Text>
                    <Text style={styles.statLabel}>Total Jobs</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{user?.helperProfile?.rating?.toFixed(1) || '0.0'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
            </View>

            {!isVerifiedHelper && (
                <View style={styles.notice}>
                    <Text style={styles.noticeText}>Your account is pending verification. Once verified, you can start accepting jobs.</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 20, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    badge: { backgroundColor: COLORS.secondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    pendingBadge: { backgroundColor: COLORS.warning },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    stats: { flexDirection: 'row', padding: 20, gap: 16 },
    statCard: { flex: 1, backgroundColor: COLORS.surface, padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    statNumber: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary },
    statLabel: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
    notice: { margin: 20, padding: 16, backgroundColor: '#FEF3C7', borderRadius: 8 },
    noticeText: { color: '#92400E', fontSize: 14 }
});

export default HomeScreen;
