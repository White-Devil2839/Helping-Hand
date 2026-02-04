import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../../services';
import { COLORS, ROLES } from '../../config';

const UsersScreen = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    const fetchUsers = useCallback(async () => {
        try {
            const params = {};
            if (filter !== 'all') params.role = filter;

            const response = await api.get('/admin/users', { params });
            setUsers(response.data.users);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case ROLES.ADMIN: return COLORS.danger;
            case ROLES.HELPER: return COLORS.secondary;
            case ROLES.CUSTOMER: return COLORS.primary;
            default: return COLORS.textSecondary;
        }
    };

    const renderUser = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userPhone}>{item.phone}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
                    <Text style={styles.roleText}>{item.role}</Text>
                </View>
            </View>

            {item.role === ROLES.HELPER && item.helperProfile && (
                <View style={styles.helperInfo}>
                    {item.helperProfile.isVerified ? (
                        <Text style={styles.verified}>✓ Verified</Text>
                    ) : (
                        <Text style={styles.pending}>⏳ Pending Verification</Text>
                    )}
                    {item.helperProfile.rating && (
                        <Text style={styles.rating}>
                            ⭐ {item.helperProfile.rating.toFixed(1)} ({item.helperProfile.totalBookings || 0} jobs)
                        </Text>
                    )}
                </View>
            )}

            <Text style={styles.joinedDate}>
                Joined {new Date(item.createdAt).toLocaleDateString()}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Filter Tabs */}
            <View style={styles.filters}>
                {['all', ROLES.CUSTOMER, ROLES.HELPER, ROLES.ADMIN].map((role) => (
                    <TouchableOpacity
                        key={role}
                        style={[styles.filterTab, filter === role && styles.activeFilter]}
                        onPress={() => setFilter(role)}
                    >
                        <Text style={[styles.filterText, filter === role && styles.activeFilterText]}>
                            {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={users}
                keyExtractor={item => item._id}
                renderItem={renderUser}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No users found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    filters: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        marginHorizontal: 4
    },
    activeFilter: { backgroundColor: COLORS.primary },
    filterText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
    activeFilterText: { color: '#fff', fontWeight: '600' },
    list: { padding: 16 },
    userCard: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    userHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    userName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    userPhone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    roleText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    helperInfo: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
    verified: { fontSize: 13, color: COLORS.secondary, fontWeight: '600' },
    pending: { fontSize: 13, color: COLORS.warning, fontWeight: '600' },
    rating: { fontSize: 13, color: COLORS.text },
    joinedDate: { fontSize: 12, color: COLORS.textSecondary },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 16, color: COLORS.textSecondary }
});

export default UsersScreen;
