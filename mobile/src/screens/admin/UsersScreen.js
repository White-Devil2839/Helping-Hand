import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useAdminUsers } from '../../hooks/useAdmin';
import { COLORS, ROLES } from '../../config';

const UsersScreen = ({ navigation }) => {
    const { users, loading, fetchUsers, deactivateUser, activateUser } = useAdminUsers();
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    const loadUsers = useCallback(async () => {
        const params = {};
        if (filter !== 'all') params.role = filter;
        await fetchUsers(params);
        setRefreshing(false);
    }, [filter, fetchUsers]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUsers();
    };

    const handleDeactivate = async (user) => {
        Alert.alert(
            'Deactivate User',
            `Are you sure you want to deactivate ${user.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deactivate',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deactivateUser(user._id, 'Admin action');
                            Alert.alert('Success', 'User deactivated successfully');
                        } catch (err) {
                            Alert.alert('Error', err.message);
                        }
                    }
                }
            ]
        );
    };

    const handleActivate = async (user) => {
        try {
            await activateUser(user._id);
            Alert.alert('Success', 'User activated successfully');
        } catch (err) {
            Alert.alert('Error', err.message);
        }
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
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigation.navigate('UserDetail', { userId: item._id })}
            activeOpacity={0.7}
        >
            <View style={styles.userHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userPhone}>{item.phone}</Text>
                </View>
                <View>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
                        <Text style={styles.roleText}>{item.role}</Text>
                    </View>
                    {!item.isActive && (
                        <View style={[styles.statusBadge, { marginTop: 4 }]}>
                            <Text style={styles.statusText}>INACTIVE</Text>
                        </View>
                    )}
                </View>
            </View>
            {item.role === ROLES.HELPER && item.helperProfile && (
                <View style={styles.helperInfo}>
                    {item.helperProfile.isVerified
                        ? <Text style={styles.verified}>✓ Verified</Text>
                        : <Text style={styles.pending}>⏳ Pending Verification</Text>
                    }
                    {item.helperProfile.rating
                        ? <Text style={styles.rating}>
                            ⭐ {item.helperProfile.rating.toFixed(1)} ({item.helperProfile.totalBookings || 0} jobs)
                        </Text>
                        : null
                    }
                </View>
            )}

            <Text style={styles.joinedDate}>Joined {new Date(item.createdAt).toLocaleDateString()}</Text>
            {/* Action Buttons */}
            <View style={styles.actions}>
                {item.isActive ? (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deactivateButton]}
                        onPress={() => handleDeactivate(item)}
                    >
                        <Text style={styles.actionButtonText}>Deactivate</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.activateButton]}
                        onPress={() => handleActivate(item)}
                    >
                        <Text style={styles.actionButtonText}>Activate</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    // Filter users based on selected role
    const filteredUsers = filter === 'all'
        ? users
        : users.filter(user => user.role === filter);

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
                {['all', 'customer', 'helper'].map((role) => (
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
                data={filteredUsers}
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
    statusBadge: { backgroundColor: COLORS.textSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    statusText: { color: '#fff', fontSize: 10, fontWeight: '600' },
    helperInfo: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
    verified: { fontSize: 13, color: COLORS.secondary, fontWeight: '600', marginRight: 12 },
    pending: { fontSize: 13, color: COLORS.warning, fontWeight: '600', marginRight: 12 },
    rating: { fontSize: 13, color: COLORS.text },
    joinedDate: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
    actions: { flexDirection: 'row', marginTop: 8 },
    actionButton: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginHorizontal: 4 },
    deactivateButton: { backgroundColor: COLORS.danger },
    activateButton: { backgroundColor: COLORS.secondary },
    actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 16, color: COLORS.textSecondary }
});

export default UsersScreen;
