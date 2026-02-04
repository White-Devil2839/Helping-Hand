import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context';
import { api } from '../../services';
import { COLORS } from '../../config';

const ProfileScreen = () => {
    const { user, logout, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const response = await api.patch('/users/me', { name: name.trim() });
            if (response.data && response.data.user) {
                updateUser(response.data.user);
                setIsEditing(false);
                Alert.alert('Success', 'Profile updated successfully');
            }
        } catch (err) {
            console.error('Profile update error:', err);
            Alert.alert('Error', err.response?.data?.error || 'Failed to update profile');
            // Revert name on error
            setName(user?.name || '');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setName(user?.name || '');
        setIsEditing(false);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                {isEditing ? (
                    <>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            autoFocus
                        />
                    </>
                ) : (
                    <Text style={styles.name}>{user?.name}</Text>
                )}

                <Text style={styles.phone}>{user?.phone}</Text>
                <Text style={styles.role}>Role: {user?.role}</Text>

                {user?.helperProfile?.isVerified && (
                    <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓ Verified Helper</Text>
                    </View>
                )}
            </View>

            {isEditing ? (
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleCancel}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.saveButton]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                >
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
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
    label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text
    },
    name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    phone: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
    role: { fontSize: 14, color: COLORS.primary, marginTop: 8, textTransform: 'capitalize' },
    verifiedBadge: {
        marginTop: 12,
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    verifiedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    buttonRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
    button: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: COLORS.textSecondary },
    saveButton: { backgroundColor: COLORS.primary },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    editButton: {
        marginTop: 20,
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    editButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    logoutButton: {
        marginTop: 12,
        backgroundColor: COLORS.danger,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default ProfileScreen;
