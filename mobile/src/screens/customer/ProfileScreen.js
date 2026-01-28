import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context';
import { COLORS } from '../../config';

const ProfileScreen = () => {
    const { user, logout } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.phone}>{user?.phone}</Text>
                <Text style={styles.role}>Role: {user?.role}</Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    card: {
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    phone: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
    role: { fontSize: 14, color: COLORS.primary, marginTop: 8, textTransform: 'capitalize' },
    logoutButton: {
        marginTop: 20,
        backgroundColor: COLORS.danger,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default ProfileScreen;
