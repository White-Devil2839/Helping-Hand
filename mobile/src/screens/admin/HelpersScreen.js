import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAdminHelpers } from '../../hooks';
import { COLORS } from '../../config';

const HelpersScreen = ({ navigation }) => {
    const { helpers, loading, error, fetchPendingHelpers, verifyHelper } = useAdminHelpers();
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchPendingHelpers();
    }, [fetchPendingHelpers]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPendingHelpers();
        setRefreshing(false);
    };

    const handleVerify = (helper) => {
        Alert.alert(
            'Verify Helper',
            `Verify ${helper.name} as a helper?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Verify',
                    onPress: async () => {
                        setActionLoading(helper._id);
                        try {
                            await verifyHelper(helper._id, 'Verified by admin');
                            Alert.alert('Success', 'Helper verified');
                            fetchPendingHelpers();
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

    const renderHelper = ({ item }) => (
        <View style={styles.helperCard}>
            <View style={styles.helperInfo}>
                <Text style={styles.helperName}>{item.name}</Text>
                <Text style={styles.helperPhone}>{item.phone}</Text>
                {item.helperProfile?.bio && (
                    <Text style={styles.helperBio} numberOfLines={2}>{item.helperProfile.bio}</Text>
                )}
                <Text style={styles.helperDate}>
                    Joined: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.verifyButton, actionLoading === item._id && styles.buttonDisabled]}
                onPress={() => handleVerify(item)}
                disabled={actionLoading === item._id}
            >
                <Text style={styles.verifyButtonText}>
                    {actionLoading === item._id ? '...' : 'Verify'}
                </Text>
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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pending Verification</Text>
                <Text style={styles.headerCount}>{helpers.length} helpers</Text>
            </View>

            <FlatList
                data={helpers}
                keyExtractor={item => item._id}
                renderItem={renderHelper}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No pending helpers</Text>
                        <Text style={styles.emptyHint}>All helpers have been verified!</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        padding: 16,
        backgroundColor: COLORS.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    headerCount: { fontSize: 14, color: COLORS.textSecondary },
    list: { padding: 16 },
    helperCard: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    helperInfo: { flex: 1, marginRight: 12 },
    helperName: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    helperPhone: { fontSize: 14, color: COLORS.primary, marginTop: 2 },
    helperBio: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
    helperDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
    verifyButton: { backgroundColor: COLORS.secondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    buttonDisabled: { opacity: 0.6 },
    verifyButtonText: { color: '#fff', fontWeight: '600' },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 18, color: COLORS.textSecondary },
    emptyHint: { fontSize: 14, color: COLORS.secondary, marginTop: 4 }
});

export default HelpersScreen;
