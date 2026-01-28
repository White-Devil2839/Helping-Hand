import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuditLog } from '../../hooks';
import { COLORS } from '../../config';

const AuditLogScreen = () => {
    const { logs, loading, pagination, fetchLogs } = useAuditLog();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    };

    const getActionColor = (actionType) => {
        if (!actionType) return COLORS.primary;
        if (actionType.includes('CANCEL') || actionType.includes('DEACTIVATE') || actionType.includes('FORCE')) return COLORS.danger;
        if (actionType.includes('VERIFY') || actionType.includes('ACTIVATE')) return COLORS.secondary;
        if (actionType.includes('DISPUTE')) return COLORS.warning;
        return COLORS.primary;
    };

    const renderLog = ({ item }) => (
        <View style={styles.logCard}>
            <View style={styles.logHeader}>
                <View style={[styles.actionBadge, { backgroundColor: getActionColor(item.actionType) }]}>
                    <Text style={styles.actionText}>{(item.actionType || 'UNKNOWN').replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.timestamp}>
                    {new Date(item.createdAt).toLocaleString()}
                </Text>
            </View>

            <View style={styles.logDetails}>
                <Text style={styles.adminName}>By: {item.admin?.name || 'System'}</Text>
                <Text style={styles.target}>
                    Target: {item.targetType} ({item.targetId?.toString().slice(-6) || 'N/A'})
                </Text>
                {item.reason && <Text style={styles.reason}>Reason: {item.reason}</Text>}
            </View>
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
                <Text style={styles.headerTitle}>Admin Actions</Text>
                <Text style={styles.headerCount}>{pagination.total} entries</Text>
            </View>

            <FlatList
                data={logs}
                keyExtractor={item => item._id}
                renderItem={renderLog}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No audit logs</Text>
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
    logCard: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    actionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    actionText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    timestamp: { fontSize: 12, color: COLORS.textSecondary },
    logDetails: {},
    adminName: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
    target: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
    reason: { fontSize: 13, color: COLORS.text, fontStyle: 'italic', marginTop: 8, padding: 8, backgroundColor: COLORS.background, borderRadius: 4 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { fontSize: 16, color: COLORS.textSecondary }
});

export default AuditLogScreen;
